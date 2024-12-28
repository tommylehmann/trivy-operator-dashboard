using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class TrivyReportDomainService<TKubernetesObject>
    where TKubernetesObject : class
{
    protected CustomResourceDefinition TrivyReportCrd => this.customResourceDefinitionFactory.Get<TKubernetesObject>();

    protected TrivyReportDomainService(IKubernetesClientFactory kubernetesClientFactory,
        ICustomResourceDefinitionFactory customResourceDefinitionFactory)
    {
        this.kubernetesClientFactory = kubernetesClientFactory;
        this.customResourceDefinitionFactory = customResourceDefinitionFactory;
    }
    public abstract Task<IList<TKubernetesObject>> GetReports();

    protected IKubernetesClientFactory kubernetesClientFactory;
    protected ICustomResourceDefinitionFactory customResourceDefinitionFactory;
}
