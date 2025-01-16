using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class SbomReportWatcher(
    INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>>
        namespacedResourceWatchDomainService,
    IBackgroundQueue<SbomReportCr> backgroundQueue,
    IServiceProvider serviceProvider,
    ILogger<SbomReportWatcher> logger)
    : NamespacedWatcher<CustomResourceList<SbomReportCr>, SbomReportCr, IBackgroundQueue<SbomReportCr>,
        WatcherEvent<SbomReportCr>>(namespacedResourceWatchDomainService, backgroundQueue, serviceProvider, logger)
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
