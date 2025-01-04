using k8s;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public class NamespacedTrivyReportDomainService<TKubernetesObject>(IKubernetesClientFactory kubernetesClientFactory,
    ICustomResourceDefinitionFactory customResourceDefinitionFactory,
    IKubernetesNamespaceDomainService kubernetesNamespaceDomainService) : TrivyReportDomainService<TKubernetesObject>(kubernetesClientFactory, customResourceDefinitionFactory)
    where TKubernetesObject : CustomResource, new()
{
    protected IKubernetesNamespaceDomainService kubernetesNamespaceDomainService = kubernetesNamespaceDomainService;

    public async override Task<IList<TKubernetesObject>> GetReports()
    {
        List<string> namespaceNames = await kubernetesNamespaceDomainService.GetKubernetesNamespaces();
        List<TKubernetesObject> trivyReports = [];
        foreach (var namespaceName in namespaceNames?? [])
        {
            IList<TKubernetesObject> trivyReportsInNamespace = await GetReports(namespaceName);
            trivyReports.AddRange(trivyReportsInNamespace);
        }
        return trivyReports;
    }

    public async Task<IList<TKubernetesObject>> GetReports(string namespaceName)
    {
        return (await GetReportsList(namespaceName)).Items;
    }

    public async Task<CustomResourceList<TKubernetesObject>> GetReportsList(string namespaceName, int? pageLimit = null, string? continueToken = null)
    {
        return await kubernetesClientFactory.GetClient()
            .ListNamespacedCustomObjectAsync<CustomResourceList<TKubernetesObject>>(
                TrivyReportCrd.Group,
                TrivyReportCrd.Version,
                namespaceName,
                TrivyReportCrd.PluralName,
                limit: pageLimit,
                continueParameter: continueToken);
        //return JsonSerializer.Deserialize<CustomResourceList<TKubernetesObject>>(trivyReportsJson?.ToString() ?? string.Empty) ?? new();
    }

    public async Task<TKubernetesObject> GetReport(string resourceName, string namespaceName)
    {
        return await kubernetesClientFactory.GetClient()
            .CustomObjects.GetNamespacedCustomObjectAsync<TKubernetesObject>(
                TrivyReportCrd.Group,
                TrivyReportCrd.Version,
                namespaceName,
                TrivyReportCrd.PluralName,
                resourceName);
    }
}
