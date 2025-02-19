namespace TrivyOperator.Dashboard.Application.Services.WatcherStates;

public class WatcherStateInfo
{
    public required Type WatchedKubernetesObjectType { get; set; }
    public string? NamespaceName { get; set; }
    public WatcherStateStatus Status { get; set; }
    public Exception? LastException { get; set; }
    public DateTime LastEventMoment { get; init; } = DateTime.Now;
}
