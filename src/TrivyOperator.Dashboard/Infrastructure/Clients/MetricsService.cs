using System.Diagnostics.Metrics;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Infrastructure.Clients;

public class MetricsService : IMetricsService
{
    private readonly Meter _meter;
    public string AppName { get; private set; }

    public Counter<long> WatcherProcessedMessagesCounter { get; private set; }

    public MetricsService(string appName)
    {
        _meter = new Meter($"{appName}.metrics");
        this.AppName = appName;

        WatcherProcessedMessagesCounter = _meter.CreateCounter<long>(
            name: $"{appName}.watcher.processed_messages.count",
            unit: "events",
            description: "Counts the total number of processed messages in watcher."
        );
    }

    public void CreateObservableGauge(string name, Func<IEnumerable<Measurement<long>>> observeValues, string? unit, string? description)
    {
        _meter.CreateObservableGauge(name, observeValues, unit: unit, description: description);
    }
}
