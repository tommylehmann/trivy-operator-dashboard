using k8s;
using k8s.Models;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;

public interface ICacheWatcherEventHandler
{
    void Start(CancellationToken cancellationToken, string watcherKey = VarUtils.DefaultCacheRefreshKey);
}
