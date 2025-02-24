using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;

public interface INamespacedCacheWatcherEventHandler : ICacheWatcherEventHandler
{
    void Stop(string watcherKey = VarUtils.DefaultCacheRefreshKey);
}
