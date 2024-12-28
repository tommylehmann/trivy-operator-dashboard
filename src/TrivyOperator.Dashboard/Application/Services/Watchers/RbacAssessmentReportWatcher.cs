using k8s;
using k8s.Autorest;
using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.RbacAssessmentReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Watchers;

public class RbacAssessmentReportWatcher(
    IKubernetesClientFactory kubernetesClientFactory,
    IBackgroundQueue<RbacAssessmentReportCr> backgroundQueue,
    IServiceProvider serviceProvider,
    AsyncPolicy retryPolicy,
    ILogger<RbacAssessmentReportWatcher> logger)
    : NamespacedWatcher<CustomResourceList<RbacAssessmentReportCr>, RbacAssessmentReportCr,
        IBackgroundQueue<RbacAssessmentReportCr>, WatcherEvent<RbacAssessmentReportCr>>(
        kubernetesClientFactory,
        backgroundQueue,
        serviceProvider,
        retryPolicy,
        logger)
{
    protected override async Task<HttpOperationResponse<CustomResourceList<RbacAssessmentReportCr>>>
        GetKubernetesObjectWatchList(
            IKubernetesObject<V1ObjectMeta>? sourceKubernetesObject,
            string? lastResourceVersion,
            CancellationToken cancellationToken)
    {
        RbacAssessmentReportCrd myCrd = new();

        return await KubernetesClient.CustomObjects
            .ListNamespacedCustomObjectWithHttpMessagesAsync<CustomResourceList<RbacAssessmentReportCr>>(
                myCrd.Group,
                myCrd.Version,
                GetNamespaceFromSourceEvent(sourceKubernetesObject),
                myCrd.PluralName,
                watch: true,
                resourceVersion: lastResourceVersion,
                timeoutSeconds: GetWatcherRandomTimeout(),
                cancellationToken: cancellationToken);
    }
}
