using k8s.Models;
using System.Collections.Concurrent;
using TrivyOperator.Dashboard.Application.Services.Namespaces.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Services.Namespaces;

public class NamespaceService(IConcurrentDictionaryCache<V1Namespace> cache) : INamespaceService
{
    public Task<IEnumerable<string>> GetKubernetesNamespaces()
    {
        IEnumerable<string> namespaceNames = [];
        if (cache.TryGetValue(CacheUtils.DefaultCacheRefreshKey, out ConcurrentDictionary<string, V1Namespace>? namespacesCache))
        {
            namespaceNames = [.. namespacesCache.Values.Select(x => x.Metadata.Name)];
        }

        return Task.FromResult(namespaceNames);
    }
}
