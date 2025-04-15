using System.Diagnostics.Metrics;

namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;
public interface IMetricsService
{
    Counter<long> WatcherProcessedMessagesCounter { get; }

    void CreateObservableGauge(string name, Func<IEnumerable<Measurement<long>>> observeValues, string? unit, string? description);
    string AppName { get; }
}