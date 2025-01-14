using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using System.Net;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;

public abstract class
    KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>(
        IKubernetesClientFactory kubernetesClientFactory,
        TBackgroundQueue backgroundQueue,
        IServiceProvider serviceProvider,
        AsyncPolicy retryPolicy,
        ILogger<KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>>
            logger) : IKubernetesWatcher<TKubernetesObject>
    where TKubernetesObject : IKubernetesObject<V1ObjectMeta>
    where TKubernetesObjectList : IKubernetesObject<V1ListMeta>, IItems<TKubernetesObject>
    where TKubernetesWatcherEvent : IWatcherEvent<TKubernetesObject>, new()
    where TBackgroundQueue : IBackgroundQueue<TKubernetesObject>

{
    protected readonly TBackgroundQueue BackgroundQueue = backgroundQueue;
    protected readonly Kubernetes KubernetesClient = kubernetesClientFactory.GetClient();

    protected readonly Dictionary<string, TaskWithCts> Watchers = [];

    private static readonly Random _random = new();

    public Task Add(CancellationToken cancellationToken, IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject = null)
    {
        string watcherKey = GetNamespaceFromSourceEvent(sourceKubernetesObject);
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
        bool isRecoveringFromError = false;
        bool isFreshStart = true;
        string? lastResourceVersion = null;
        string watcherKey = GetNamespaceFromSourceEvent(sourceKubernetesObject);
        while (!cancellationToken.IsCancellationRequested)
        {
            await retryPolicy.ExecuteAsync(async () =>
            {
                try
                {
                    Task<HttpOperationResponse<TKubernetesObjectList>> kubernetesObjectsResp =
                        GetKubernetesObjectWatchList(sourceKubernetesObject, lastResourceVersion, cancellationToken);
                    await foreach ((WatchEventType type, TKubernetesObject item) in kubernetesObjectsResp
                                       .WatchAsync<TKubernetesObject, TKubernetesObjectList>(
                                           ex => logger.LogError(
                                               $"{nameof(KubernetesWatcher<TKubernetesObjectList, TKubernetesObject, TBackgroundQueue, TKubernetesWatcherEvent>)} - WatchAsync - {ex.Message}",
                                               ex),
                                           cancellationToken))
                    {
                        if (isRecoveringFromError || isFreshStart)
                        {
                            using IServiceScope scope = serviceProvider.CreateScope();
                            IWatcherState watcherState = scope.ServiceProvider.GetRequiredService<IWatcherState>();
                            await watcherState.ProcessWatcherSuccess(typeof(TKubernetesObject), watcherKey);
                            isRecoveringFromError = false;
                            isFreshStart = false;
                        }
                        logger.LogDebug("Sending to Queue - {kubernetesObjectType} - {kubernetesWatchEvent} - {watcherKey} - {kubernetesObjectName} - {kubernetesObjectResourceVersion}",
                            typeof(TKubernetesObject).Name,
                            type.ToString(),
                            watcherKey,
                            item.Metadata.Name,
                            item.Metadata.ResourceVersion);

                        ProcessReceivedKubernetesObject(item);
                        TKubernetesWatcherEvent kubernetesWatcherEvent =
                            new() { KubernetesObject = item, WatcherEventType = type };
                        if (type == WatchEventType.Bookmark)
                        {
                            lastResourceVersion = item.Metadata.ResourceVersion;
                            logger.LogInformation("Bookmark Event - Resource Version - {resourceVersion}", lastResourceVersion);
                        }
                        else
                        {
                            await BackgroundQueue.QueueBackgroundWorkItemAsync(kubernetesWatcherEvent);
                        }
                    }
                }
                catch (HttpRequestException ex) when (ex.InnerException is IOException)// && ex.InnerException.InnerException is System.Net.Sockets.SocketException)
                {
                    throw;
                }
                catch (HttpOperationException hoe) when (hoe.Response.StatusCode is HttpStatusCode.Unauthorized
                                                             or HttpStatusCode.Forbidden or HttpStatusCode.NotFound)
                {
                    using IServiceScope scope = serviceProvider.CreateScope();
                    IWatcherState watcherState = scope.ServiceProvider.GetRequiredService<IWatcherState>();
                    await watcherState.ProcessWatcherError(typeof(TKubernetesObject), watcherKey, hoe);
                }
                catch (TaskCanceledException)
                {
                    using IServiceScope scope = serviceProvider.CreateScope();
                    IWatcherState watcherState = scope.ServiceProvider.GetRequiredService<IWatcherState>();
                    await watcherState.ProcessWatcherCancel(typeof(TKubernetesObject), watcherKey);
                }
                catch (Exception ex)
                {
                    logger.LogError(
                        ex,
                        "Watcher for {kubernetesObjectType} and key {watcherKey} crashed - {ex.Message}",
                        typeof(TKubernetesObject).Name,
                        watcherKey,
                        ex.Message);
                }

                bool enqueueErrorEventIsSuccessful = false;
                while (!cancellationToken.IsCancellationRequested && !enqueueErrorEventIsSuccessful)
                {
                    try
                    {
                        logger.LogDebug("Sending to Queue - {kubernetesObjectType} - EventWithError - {watcherKey} - {kubernetesObjectName}",
                            typeof(TKubernetesObject).Name,
                            watcherKey,
                            sourceKubernetesObject?.Metadata.Name);

                        await EnqueueWatcherEventWithError(sourceKubernetesObject);
                        enqueueErrorEventIsSuccessful = true;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(
                            ex,
                            "Watcher for {kubernetesObjectType} and key {watcherKey} could not enqueue EventWithError - {ex.Message}",
                            typeof(TKubernetesObject).Name,
                            watcherKey,
                            ex.Message);
                        await Task.Delay(10000, cancellationToken);
                    }

                }

                await Task.Delay(60000, cancellationToken);
                isRecoveringFromError = true;
            });
        }
    }

    protected string GetNamespaceFromSourceEvent(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject) =>
        sourceKubernetesObject is V1Namespace
            ? sourceKubernetesObject.Metadata.Name
            : VarUtils.GetCacheRefreshKey(sourceKubernetesObject);

    protected abstract Task<HttpOperationResponse<TKubernetesObjectList>> GetKubernetesObjectWatchList(
        IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
        string? lastResourceVersion,
        CancellationToken cancellationToken);

    protected abstract Task EnqueueWatcherEventWithError(IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject);

    protected virtual void ProcessReceivedKubernetesObject(TKubernetesObject kubernetesObject) 
    { }

    protected static int GetWatcherRandomTimeout()
    {
        return _random.Next(60, 91);
    }
}
