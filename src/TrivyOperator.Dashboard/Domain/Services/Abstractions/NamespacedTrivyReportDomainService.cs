using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public class NamespacedTrivyReportDomainService<TKubernetesObject> : TrivyReportDomainService<TKubernetesObject>
    //IKubernetesClientFactory kubernetesClientFactory,
    //ICustomResourceDefinitionFactory customResourceDefinitionFactory,
    //IKubernetesNamespaceDomainService kubernetesNamespaceDomainService)
    where TKubernetesObject : class
{
    public NamespacedTrivyReportDomainService(IKubernetesClientFactory kubernetesClientFactory,
        ICustomResourceDefinitionFactory customResourceDefinitionFactory,
        IKubernetesNamespaceDomainService kubernetesNamespaceDomainService) : base(kubernetesClientFactory, customResourceDefinitionFactory)
    {
        this.kubernetesNamespaceDomainService = kubernetesNamespaceDomainService;
    }

    protected IKubernetesNamespaceDomainService kubernetesNamespaceDomainService;

    public override Task<IList<TKubernetesObject>> GetReports() => Task.FromResult<IList<TKubernetesObject>>([]);
}
