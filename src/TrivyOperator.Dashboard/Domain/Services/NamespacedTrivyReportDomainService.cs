using k8s;
using k8s.Autorest;
using k8s.Models;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services;

public class NamespacedTrivyReportDomainService<TKubernetesObject>(IKubernetesClientFactory kubernetesClientFactory,
    ICustomResourceDefinitionFactory customResourceDefinitionFactory,
    IClusterScopedResourceDomainService<V1Namespace, V1NamespaceList> namespaceDomainService)
        : NamespacedResourceDomainService<TKubernetesObject, CustomResourceList<TKubernetesObject>>(kubernetesClientFactory, namespaceDomainService)
        where TKubernetesObject : CustomResource
{
    protected CustomResourceDefinition trivyReportCrd
    {
        get
        {
            if (_trivyReportCrd == null)
            {
                _trivyReportCrd = customResourceDefinitionFactory.Get<TKubernetesObject>();
            }
            return _trivyReportCrd;
        }
    }
    private CustomResourceDefinition? _trivyReportCrd;

    public override async Task<CustomResourceList<TKubernetesObject>> GetResourceList(string namespaceName, int? pageLimit = null, string? continueToken = null)
    {
        return await kubernetesClientFactory.GetClient()
            .ListNamespacedCustomObjectAsync<CustomResourceList<TKubernetesObject>>(
                trivyReportCrd.Group,
                trivyReportCrd.Version,
                namespaceName,
                trivyReportCrd.PluralName,
                limit: pageLimit,
                continueParameter: continueToken);
    }

    public override async Task<TKubernetesObject> GetResource(string resourceName, string namespaceName)
    {
        return await kubernetesClientFactory.GetClient()
            .CustomObjects.GetNamespacedCustomObjectAsync<TKubernetesObject>(
                trivyReportCrd.Group,
                trivyReportCrd.Version,
                namespaceName,
                trivyReportCrd.PluralName,
                resourceName);
    }

    public override async Task<HttpOperationResponse<CustomResourceList<TKubernetesObject>>> GetResourceWatchList(
        string namespaceName,
        string? lastResourceVersion = null,
        int? timeoutSeconds = null,
        CancellationToken cancellationToken = new())
    {
        return await kubernetesClientFactory.GetClient()
            .CustomObjects
            .ListNamespacedCustomObjectWithHttpMessagesAsync<CustomResourceList<TKubernetesObject>>(
                trivyReportCrd.Group,
                trivyReportCrd.Version,
                namespaceName,
                trivyReportCrd.PluralName,
                watch: true,
                resourceVersion: lastResourceVersion,
                timeoutSeconds: timeoutSeconds,
                cancellationToken: cancellationToken);
    }
}
