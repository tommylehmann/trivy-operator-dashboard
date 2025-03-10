using k8s;
using k8s.Autorest;
using k8s.Models;
using Microsoft.Extensions.Options;
using System.Net;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public abstract class KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        TBackgroundQueue backgroundQueue,
        IBackgroundQueue<WatcherStateInfo> backgroundQueueWatcherState,
        IOptions<WatchersOptions> options,
        ILogger<KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>> logger)
    : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>, new()
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IKubernetesBackgroundQueue<TKubernetesObject>

{
    private static readonly Random random = new();
    protected readonly TBackgroundQueue BackgroundQueue = backgroundQueue;
    protected readonly double maxBackoffSeconds = 60;
    protected readonly int resourceListPageSize = 500;
    protected readonly Dictionary<string, TaskWithCts> Watchers = [];

    public Task Add(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        if (Watchers.TryGetValue(watcherKey, out _))
        {
            logger.LogWarning(
                "Watcher for {kubernetesObjectType} and key {watcherKey} already existing. Ignoring Add req.",
                typeof(TKubernetesObject).Name,
                watcherKey);
            return Task.CompletedTask;
        }
        logger.LogInformation(
            "Adding Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            watcherKey);
        CancellationTokenSource cts = new();
        TaskWithCts watcherWithCts = new()
        {
            Task = CreateWatch(
                watcherKey,
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token).Token),
            Cts = cts,
        };

        Watchers.Add(watcherKey, watcherWithCts);

        return Task.CompletedTask;
    }

    public async Task Delete(string watcherKey, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Deleting Watcher for {kubernetesObjectType} and key {watcherKey}.",
            typeof(TKubernetesObject).Name,
            watcherKey);
        await EnqueueWatcherEventWithError(watcherKey);
        if (Watchers.TryGetValue(watcherKey, out TaskWithCts taskWithCts))
        {
            taskWithCts.Cts.Cancel();
            // TODO: do I have to wait for Task.IsCanceled?
            Watchers.Remove(watcherKey);
        }
        await UpdateWatcherState(WatcherStateStatus.Deleted, watcherKey, cancellationToken);
    }

    public async Task Recreate(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey)
    {
        logger.LogWarning("Recreated called for {kubernetesObjectType} - {watcherKey}", typeof(TKubernetesObject).Name,
                        watcherKey);
        await Delete(watcherKey, cancellationToken);
        await Add(cancellationToken, watcherKey);
    }

    protected async Task CreateWatch(
        string watcherKey,
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
                        watcherKey,
                        cancellationToken);
                    logger.LogInformation(
                        "Initial Resources Processed - {kubernetesObjectType} - {watcherKey} - {lastResourceVersion}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        lastResourceVersion);
                    TKubernetesWatcherEvent kubernetesWatcherEvent =
                                new() { KubernetesObject = new(), WatcherEventType = WatchEventType.Bookmark };
                    await BackgroundQueue.QueueBackgroundWorkItemAsync(kubernetesWatcherEvent);
                }

                await UpdateWatcherState(WatcherStateStatus.Green, watcherKey, cancellationToken);

                do
                {
                    isBenignError = false;
                    Task<HttpOperationResponse<TKubernetesObjectList>> kubernetesObjectsResp =
                        GetKubernetesObjectWatchList(watcherKey, lastResourceVersion, cancellationToken);
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
                        await UpdateWatcherState(WatcherStateStatus.Green, watcherKey, cancellationToken);

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
                await UpdateWatcherState(WatcherStateStatus.Red, watcherKey, hoe, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                // be free and be gone :-)
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Watcher {kubernetesObjectType} - {watcherKey} crashed - {exceptionMessage}",
                    typeof(TKubernetesObject).Name,
                    watcherKey,
                    ex.Message);
                await UpdateWatcherState(WatcherStateStatus.Red, watcherKey, ex, cancellationToken);
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

                        await EnqueueWatcherEventWithError(watcherKey);
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
                        await UpdateWatcherState(WatcherStateStatus.Red, watcherKey, ex, cancellationToken);
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
        string watcherKey,
        CancellationToken? cancellationToken = null)
    {
        string? continueToken = null;
        string? lastResourceVersion;

        do
        {
            TKubernetesObjectList customResourceList = await GetInitialResources(
                watcherKey,
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
        string watcherKey,
        string? continueToken,
        CancellationToken? cancellationToken = null);

    protected abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        string watcherKey,
        string? lastResourceVersion,
        CancellationToken? cancellationToken = null);

    protected abstract Task EnqueueWatcherEventWithError(string watcherKey);

    protected virtual void ProcessReceivedKubernetesObject(TKubernetesObject kubernetesObject)
    { }

    protected int GetWatcherRandomTimeout() 
        => random.Next(options.Value.WatchTimeoutInSeconds, (int)(options.Value.WatchTimeoutInSeconds * 1.1));

    protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, string watcherKey, CancellationToken cancellationToken)
        => await UpdateWatcherState(watcherStateStatus, watcherKey, null, cancellationToken);
    protected async Task UpdateWatcherState(WatcherStateStatus watcherStateStatus, string watcherKey, Exception? exception, CancellationToken cancellationToken)
    {
        WatcherStateInfo watcherStateInfo = new()
        {
            WatchedKubernetesObjectType = typeof(TKubernetesObject),
            WatcherKey = watcherKey,
            Status = watcherStateStatus,
            LastException = exception,
        };

        bool enqueueEventIsSuccessful = false;
        while (!cancellationToken.IsCancellationRequested && !enqueueEventIsSuccessful)
        {
            try
            {
                logger.LogDebug(
                    "Sending to Queue - {kubernetesObjectType} - WatchState - {watcherKey}",
                    typeof(TKubernetesObject).Name,
                    watcherKey);

                await backgroundQueueWatcherState.QueueBackgroundWorkItemAsync(watcherStateInfo);
                enqueueEventIsSuccessful = true;
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
