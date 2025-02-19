using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class SbomReportWatcher(
    INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>>
        namespacedResourceWatchDomainService,
    IKubernetesBackgroundQueue<SbomReportCr> backgroundQueue,
    IBackgroundQueue<WatcherStateInfo> backgroundQueueWatcherState,
    ILogger<SbomReportWatcher> logger)
    : NamespacedWatcher<CustomResourceList<SbomReportCr>, SbomReportCr, IKubernetesBackgroundQueue<SbomReportCr>,
        WatcherEvent<SbomReportCr>>(namespacedResourceWatchDomainService, backgroundQueue, backgroundQueueWatcherState, logger)
{
    protected override void ProcessReceivedKubernetesObject(SbomReportCr kubernetesObject)
    {
        if (kubernetesObject.Report != null)
        {
            kubernetesObject.Report.Components.ComponentsComponents = [];
            kubernetesObject.Report.Components.Dependencies = [];
        }

        base.ProcessReceivedKubernetesObject(kubernetesObject);
    }
}
