namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;

public class WatcherStateInfo
{
    public required Type WatchedKubernetesObjectType { get; set; }
    public string WatcherKey { get; set; } = string.Empty;
    public WatcherStateStatus Status { get; set; }
    public Exception? LastException { get; set; }
    public DateTime LastEventMoment { get; init; } = DateTime.UtcNow;
}
