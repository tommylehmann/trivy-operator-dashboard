using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterComplianceReport;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class ClusterComplianceReportWatcher(
    IKubernetesClientFactory kubernetesClientFactory,
    IBackgroundQueue<ClusterComplianceReportCr> backgroundQueue,
    IServiceProvider serviceProvider,
    AsyncPolicy retryPolicy,
    ILogger<ClusterComplianceReportWatcher> logger)
    : ClusterScopedWatcher<CustomResourceList<ClusterComplianceReportCr>, ClusterComplianceReportCr,
        IBackgroundQueue<ClusterComplianceReportCr>, WatcherEvent<ClusterComplianceReportCr>>(
        kubernetesClientFactory,
        backgroundQueue,
        serviceProvider,
        retryPolicy,
        logger)
{
    protected override async Task<HttpOperationResponse<CustomResourceList<ClusterComplianceReportCr>>>
        GetKubernetesObjectWatchList(
            IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
            string? lastResourceVersion,
            CancellationToken cancellationToken)
    {
        ClusterComplianceReportCrd myCrd = new();

        return await KubernetesClient.CustomObjects
            .ListClusterCustomObjectWithHttpMessagesAsync<CustomResourceList<ClusterComplianceReportCr>>(
                myCrd.Group,
                myCrd.Version,
                myCrd.PluralName,
                watch: true,
                resourceVersion: lastResourceVersion,
                timeoutSeconds: GetWatcherRandomTimeout(),
                cancellationToken: cancellationToken);
    }
}
