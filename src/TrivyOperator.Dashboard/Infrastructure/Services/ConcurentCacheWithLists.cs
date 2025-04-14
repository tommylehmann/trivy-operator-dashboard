using System.Diagnostics.Metrics;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Infrastructure.Services;

public class TrivyConcurentCache<TValue>(IMetricsService metricsService)
    : ConcurrentCache<string, IList<TValue>>(metricsService), ITrivyConcurentCache<TValue>
{
    protected override IEnumerable<Measurement<long>> GetCacheMeasurements()
    {
        List<Measurement<long>> measurements = [];
        
        foreach (var key in Keys)
        {
            measurements.Add(new Measurement<long>(
                this[key].Count,
                new KeyValuePair<string, object?>("namespace_name", key == VarUtils.DefaultCacheRefreshKey ? null : key),
                new KeyValuePair<string, object?>("trivy_report", typeof(TValue).Name)));
        }
        return measurements;
    }
}
