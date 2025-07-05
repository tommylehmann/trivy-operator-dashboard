using System.Diagnostics.Metrics;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Infrastructure.Services;

public class ListConcurrentCache<TValue>(IMetricsService metricsService)
    : ConcurrentCache<string, IList<TValue>>(metricsService), IListConcurrentCache<TValue>
{
    protected override IEnumerable<Measurement<long>> GetCacheMeasurements()
    {
        List<Measurement<long>> measurements = [];
        measurements.AddRange(Keys
            .Select(key => 
                new Measurement<long>(this[key].Count,
                    new KeyValuePair<string, object?>("value_kind", "list"),
                    new KeyValuePair<string, object?>("value_type", typeof(TValue).Name), 
                    new KeyValuePair<string, object?>("key_name", key == VarUtils.DefaultCacheRefreshKey ? null : key)
                    )));

        return measurements;
    }
}
