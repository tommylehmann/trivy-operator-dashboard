using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class SbomReportWatcher(
    INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>>
        namespacedResourceWatchDomainService,
    IKubernetesBackgroundQueue<SbomReportCr> backgroundQueue,
    IOptions<WatchersOptions> options,
    IMetricsService metricsService,
    ILogger<SbomReportWatcher> logger)
    : NamespacedWatcher<CustomResourceList<SbomReportCr>, SbomReportCr, IKubernetesBackgroundQueue<SbomReportCr>,
        WatcherEvent<SbomReportCr>>(namespacedResourceWatchDomainService, backgroundQueue,
            options, metricsService, logger)
{
    protected override void ProcessReceivedKubernetesObject(SbomReportCr kubernetesObject)
    {
        if (kubernetesObject.Report != null)
        {
            kubernetesObject.Report.Components.ComponentsComponents = [.. kubernetesObject.Report.Components.ComponentsComponents
                .Select(x => new ComponentsComponent()
                {
                    BomRef = x.BomRef,
                    Name = x.Name,
                    Version = x.Version,
                    Supplier = x.Supplier,
                    Purl = x.Purl,
                    Type = x.Type,
                })];
            kubernetesObject.Report.Components.Dependencies = [];
        }

        base.ProcessReceivedKubernetesObject(kubernetesObject);
    }
}
