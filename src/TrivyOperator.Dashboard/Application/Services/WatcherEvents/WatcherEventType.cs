using k8s;

namespace TrivyOperator.Dashboard.Application.Services.WatcherEvents;

public enum WatcherEventType
{
    Init,
    Added,
    Modified,
    Deleted,
    Error,
    Unknown,
}

public static class WatchEventTypeExtensions
{
    public static WatcherEventType ToWatcherEventType(this WatchEventType watchEvent)
    {
        return watchEvent switch
        {
            WatchEventType.Added => WatcherEventType.Added,
            WatchEventType.Modified => WatcherEventType.Modified,
            WatchEventType.Deleted => WatcherEventType.Deleted,
            WatchEventType.Error => WatcherEventType.Error,
            _ => WatcherEventType.Unknown // Handle Bookmark or any unexpected values
        };
    }
}
