using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Common;

namespace TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

public interface IWatcherStateInfoService
{
    Task<IList<WatcherStatusDto>> GetWatcherStateInfos();
    Task<OperationResult> RecreateWatcher(string kubernetesObjectType, string? namespaceName);
}
