using System.Diagnostics.Metrics;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Infrastructure.Clients;

public class MetricsService : IMetricsService
{
    private readonly Meter meter;
    
    public string AppName { get; }

    public Counter<long> WatcherProcessedMessagesCounter { get; }

    public MetricsService(string appName)
    {
        meter = new Meter($"{appName}.metrics");
        AppName = appName;

        WatcherProcessedMessagesCounter = meter.CreateCounter<long>(
            name: $"{appName}.watcher.processed_messages.count",
            unit: "events",
            description: "Counts the total number of processed messages in watcher."
        );
    }

    public void CreateObservableGauge(string name, Func<IEnumerable<Measurement<long>>> observeValues, string? unit, string? description)
    {
        meter.CreateObservableGauge(name, observeValues, unit: unit, description: description);
    }
}
