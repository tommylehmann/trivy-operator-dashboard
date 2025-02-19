using k8s;
using k8s.Autorest;
using k8s.Models;
using System.Net;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public abstract class KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        TBackgroundQueue backgroundQueue,
        //IServiceProvider serviceProvider,
        IBackgroundQueue<WatcherStateInfo> backgroundQueueWatcherState,
        ILogger<KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>> logger)
    : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>

{
    private static readonly Random random = new();
    protected readonly TBackgroundQueue BackgroundQueue = backgroundQueue;
    protected readonly double maxBackoffSeconds = 60;
    protected readonly int resourceListPageSize = 500;
    protected readonly Dictionary<string, TaskWithCts> Watchers = [];
    protected string watcherKey = string.Empty;

    public Task Add(CancellationToken cancellationToken, IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject = null)
    {
        watcherKey = GetNamespaceFromSourceEvent(sourceKubernetesObject);
        logger.LogInformation(
            "Adding Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            watcherKey);
        CancellationTokenSource cts = new();
        TaskWithCts watcherWithCts = new()
        {
            Task = CreateWatch(
                sourceKubernetesObject,
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token).Token),
            Cts = cts,
        };

        Watchers.Add(watcherKey, watcherWithCts);

        return Task.CompletedTask;
    }

    protected async Task CreateWatch(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        CancellationToken cancellationToken)
    {
        bool isBenignError = false;
        string? lastResourceVersion = null;
        RetryDurationCalculator retryDurationCalculator = new(maxBackoffSeconds);
        int retryCount = -1; // -1 - first execution, 0 - no errors, 1, 2, 3 - retries

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                if (string.IsNullOrEmpty(lastResourceVersion))
                {
                    lastResourceVersion = await ProcessInitialResourcesAndGetLastResourceVersion(
                        sourceKubernetesObject,
                        cancellationToken);
                    logger.LogInformation(
                        "Initial Resources Processed - {kubernetesObjectType} - {watcherKey} - {lastResourceVersion}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        lastResourceVersion);
                }

                await UpdateWatcherState(WatcherStateStatus.Green, cancellationToken);

                do
                {
                    isBenignError = false;
                    Task<HttpOperationResponse<TKubernetesObjectList>> kubernetesObjectsResp =
                        GetKubernetesObjectWatchList(sourceKubernetesObject, lastResourceVersion, cancellationToken);
                    await foreach ((WatchEventType type, TKubernetesObject item) in kubernetesObjectsResp
                        .WatchAsync<TKubernetesObject, TKubernetesObjectList>(
                            ex =>
                            {
                                if (ex is KubernetesException && ex.Message.StartsWith("too old resource version"))
                                {
                                    logger.LogDebug(
                                        "{kubernetesObjectType} - {watcherKey} - lastResourceVersion set to null",
                                        typeof(TKubernetesObject).Name,
                                        watcherKey);
                                    lastResourceVersion = null;
                                }
                                else
                                {
                                    throw ex;
                                }
                            },
                            cancellationToken))
                    {
                        //if (retryCount != 0)
                        //{
                        //    using IServiceScope scope = serviceProvider.CreateScope();
                        //    IWatcherStateOld watcherState = scope.ServiceProvider.GetRequiredService<IWatcherStateOld>();
                        //    await watcherState.ProcessWatcherSuccess(typeof(TKubernetesObject), watcherKey);
                        //    retryCount = 0;
                        //}

                        await UpdateWatcherState(WatcherStateStatus.Green, cancellationToken);

                        if (type == WatchEventType.Bookmark)
                        {
                            lastResourceVersion = item.Metadata.ResourceVersion;
                            logger.LogInformation(
                                "Bookmark Event - {kubernetesObjectType} - {watcherKey} - Resource Version - {resourceVersion}",
                                typeof(TKubernetesObject).Name,
                                watcherKey,
                                lastResourceVersion);
                        }
                        else
                        {
                            logger.LogInformation(
                                "Sending to Queue - {kubernetesObjectType} - {kubernetesWatchEvent} - {watcherKey} - {kubernetesObjectName} - {kubernetesObjectResourceVersion}",
                                typeof(TKubernetesObject).Name,
                                type.ToString(),
                                watcherKey,
                                item.Metadata.Name,
                                item.Metadata.ResourceVersion);
                            ProcessReceivedKubernetesObject(item);
                            TKubernetesWatcherEvent kubernetesWatcherEvent =
                                new() { KubernetesObject = item, WatcherEventType = type };
                            await BackgroundQueue.QueueBackgroundWorkItemAsync(kubernetesWatcherEvent);
                        }
                    }

                    logger.LogDebug(
                        "Watch stopped - {kubernetesObjectType} - {watcherKey} - status {watchStatus}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        kubernetesObjectsResp.Status);
                } while (!cancellationToken.IsCancellationRequested && !string.IsNullOrEmpty(lastResourceVersion));
            }
            catch (HttpRequestException ex) when (ex.InnerException is EndOfStreamException)
            {
                logger.LogDebug(
                    "Watcher {kubernetesObjectType} - {watcherKey} crashed - EndOfStreamException - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                isBenignError = true;
            }
            catch (HttpOperationException hoe) when (hoe.Response.StatusCode is HttpStatusCode.Unauthorized
                                                         or HttpStatusCode.Forbidden or HttpStatusCode.NotFound)
            {
                //using IServiceScope scope = serviceProvider.CreateScope();
                //IWatcherStateOld watcherState = scope.ServiceProvider.GetRequiredService<IWatcherStateOld>();
                //await watcherState.ProcessWatcherError(typeof(TKubernetesObject), watcherKey, hoe);
                await UpdateWatcherState(WatcherStateStatus.Red, hoe, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                await UpdateWatcherState(WatcherStateStatus.Deleted, cancellationToken); 
                //using IServiceScope scope = serviceProvider.CreateScope();
                //IWatcherStateOld watcherState = scope.ServiceProvider.GetRequiredService<IWatcherStateOld>();
                //await watcherState.ProcessWatcherCancel(typeof(TKubernetesObject), watcherKey);
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Watcher {kubernetesObjectType} - {watcherKey} crashed - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                await UpdateWatcherState(WatcherStateStatus.Red, ex, cancellationToken);
            }

            if (!isBenignError)
            {
                bool enqueueErrorEventIsSuccessful = false;
                while (!cancellationToken.IsCancellationRequested && !enqueueErrorEventIsSuccessful)
                {
                    try
                    {
                        logger.LogDebug(
                            "Sending to Queue - {kubernetesObjectType} - EventWithError - {watcherKey}",
                            typeof(TKubernetesObject).Name,
                            watcherKey);

                        await EnqueueWatcherEventWithError(sourceKubernetesObject);
                        enqueueErrorEventIsSuccessful = true;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(
                            ex,
                            "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue EventWithError - {exceptionMessage}",
                            typeof(TKubernetesObject).Name,
                            watcherKey,
                            ex.Message);
                        await Task.Delay(10000, cancellationToken);
                        await UpdateWatcherState(WatcherStateStatus.Red, ex, cancellationToken);
                    }
                }

                TimeSpan waitTimeSpan = retryDurationCalculator.GetNextRetryDuration(++retryCount);

                logger.LogDebug(
                    "Watcher for {kubernetesObjectType} and key {watcherKey} is wating for {retryCount} (ss:ms)",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    waitTimeSpan.ToString(@"ss\:fff"));
                await Task.Delay(waitTimeSpan, cancellationToken);
            }
        }
    }

    protected async Task<string> ProcessInitialResourcesAndGetLastResourceVersion(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        CancellationToken? cancellationToken = null)
    {
        string? continueToken = null;
        string? lastResourceVersion;

        do
        {
            TKubernetesObjectList customResourceList = await GetInitialResources(
                sourceKubernetesObject,
                continueToken,
                cancellationToken);

            foreach (TKubernetesObject item in customResourceList.Items ?? [])
            {
                ProcessReceivedKubernetesObject(item);
                TKubernetesWatcherEvent kubernetesWatcherEvent =
                    new() { KubernetesObject = item, WatcherEventType = WatchEventType.Added };
                await BackgroundQueue.QueueBackgroundWorkItemAsync(kubernetesWatcherEvent);
            }

            continueToken = customResourceList.Metadata.ContinueProperty;
            lastResourceVersion = customResourceList.Metadata.ResourceVersion;
        } while (!string.IsNullOrEmpty(continueToken) &&
                 !(cancellationToken.HasValue && cancellationToken.Value.IsCancellationRequested));

        return lastResourceVersion;
    }

    protected abstract Task<TKubernetesObjectList> GetInitialResources(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        string? continueToken,
        CancellationToken? cancellationToken = null);

    protected abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        string? lastResourceVersion,
        CancellationToken? cancellationToken = null);

    protected abstract Task EnqueueWatcherEventWithError(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject);

    protected virtual void ProcessReceivedKubernetesObject(TKubernetesObject kubernetesObject)
    {
    }

    protected string GetNamespaceFromSourceEvent(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject) =>
        sourceKubernetesObject is V1Namespace
            ? sourceKubernetesObject.Metadata.Name
            : VarUtils.GetCacheRefreshKey(sourceKubernetesObject);

    protected static int GetWatcherRandomTimeout() => random.Next(300, 330);

    protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, CancellationToken cancellationToken)
        => await UpdateWatcherState(watcherStateStatus, null, cancellationToken);
    protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, Exception? exception, CancellationToken cancellationToken)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            WatcherKey = watcherKey,
            Status = watcherStateStatus,
            LastException = exception,
        };

        bool enqueueErrorEventIsSuccessful = false;
        while (!cancellationToken.IsCancellationRequested && !enqueueErrorEventIsSuccessful)
        {
            try
            {
                logger.LogWarning(
                    "XXX Sending to Queue - {kubernetesObjectType} - WatchState - {watcherKey}",
                    typeof(TKubernetesObject).Name,
                    watcherKey);

                await backgroundQueueWatcherState.QueueBackgroundWorkItemAsync(watcherStateInfo);
                enqueueErrorEventIsSuccessful = true;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue WatchStateInfo - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                await Task.Delay(10000, cancellationToken);
            }
        }
    }
}
