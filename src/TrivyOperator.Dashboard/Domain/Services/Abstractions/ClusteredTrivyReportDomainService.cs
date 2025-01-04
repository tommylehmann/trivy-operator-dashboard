using k8s;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public class ClusteredTrivyReportDomainService<TKubernetesObject>(IKubernetesClientFactory kubernetesClientFactory,
    ICustomResourceDefinitionFactory customResourceDefinitionFactory) : TrivyReportDomainService<TKubernetesObject>(kubernetesClientFactory, customResourceDefinitionFactory)
    where TKubernetesObject : CustomResource, new()
{
    public override async Task<IList<TKubernetesObject>> GetReports()
    {
        return (await GetReportsList()).Items;
    }

    public async Task<CustomResourceList<TKubernetesObject>> GetReportsList(int? pageLimit = null, string? continueToken = null)
    {
        return await kubernetesClientFactory.GetClient()
            .ListClusterCustomObjectAsync<CustomResourceList<TKubernetesObject>>(
                TrivyReportCrd.Group,
                TrivyReportCrd.Version,
                TrivyReportCrd.PluralName,
                limit: pageLimit,
                continueParameter: continueToken);
    }

    public async Task<TKubernetesObject> GetReport(string resourceName)
    {
        return await kubernetesClientFactory.GetClient()
            .CustomObjects.GetClusterCustomObjectAsync<TKubernetesObject>(
                TrivyReportCrd.Group,
                TrivyReportCrd.Version,
                TrivyReportCrd.PluralName,
                resourceName);
    }
}
