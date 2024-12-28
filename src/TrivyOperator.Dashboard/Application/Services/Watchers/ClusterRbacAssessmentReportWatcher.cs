using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterRbacAssessmentReport;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class ClusterRbacAssessmentReportWatcher(
    IKubernetesClientFactory kubernetesClientFactory,
    IBackgroundQueue<ClusterRbacAssessmentReportCr> backgroundQueue,
    IServiceProvider serviceProvider,
    AsyncPolicy retryPolicy,
    ILogger<ClusterRbacAssessmentReportWatcher> logger)
    : ClusterScopedWatcher<CustomResourceList<ClusterRbacAssessmentReportCr>, ClusterRbacAssessmentReportCr,
        IBackgroundQueue<ClusterRbacAssessmentReportCr>, WatcherEvent<ClusterRbacAssessmentReportCr>>(
        kubernetesClientFactory,
        backgroundQueue,
        serviceProvider,
        retryPolicy,
        logger)
{
    protected override async Task<HttpOperationResponse<CustomResourceList<ClusterRbacAssessmentReportCr>>>
        GetKubernetesObjectWatchList(
            IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
            string? lastResourceVersion,
            CancellationToken cancellationToken)
    {
        ClusterRbacAssessmentReportCrd myCrd = new();

        return await KubernetesClient.CustomObjects
            .ListClusterCustomObjectWithHttpMessagesAsync<CustomResourceList<ClusterRbacAssessmentReportCr>>(
                myCrd.Group,
                myCrd.Version,
                myCrd.PluralName,
                watch: true,
                resourceVersion: lastResourceVersion,
                timeoutSeconds: GetWatcherRandomTimeout(),
                cancellationToken: cancellationToken);
    }
}
