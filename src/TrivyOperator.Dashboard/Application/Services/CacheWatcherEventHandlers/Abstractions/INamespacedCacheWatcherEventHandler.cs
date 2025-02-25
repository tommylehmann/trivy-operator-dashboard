using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;

public interface INamespacedCacheWatcherEventHandler : ICacheWatcherEventHandler
{
    Task Stop(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey);
}
