using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Common;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

public interface IWatcherStatusService
{
    Task<IEnumerable<WatcherStatusDto>> GetWatcherStatusDtos();
    Task<OperationResult> RecreateWatcher(string kubernetesObjectType, string? namespaceName);
}
