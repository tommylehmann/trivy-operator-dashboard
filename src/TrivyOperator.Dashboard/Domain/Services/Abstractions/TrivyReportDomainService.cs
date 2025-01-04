using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public abstract class TrivyReportDomainService<TKubernetesObject>(IKubernetesClientFactory kubernetesClientFactory,
    ICustomResourceDefinitionFactory customResourceDefinitionFactory)
    where TKubernetesObject : CustomResource, new()
{
    protected CustomResourceDefinition TrivyReportCrd
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

    public abstract Task<IList<TKubernetesObject>> GetReports();

    protected IKubernetesClientFactory kubernetesClientFactory = kubernetesClientFactory;
    protected ICustomResourceDefinitionFactory customResourceDefinitionFactory = customResourceDefinitionFactory;

    private CustomResourceDefinition? _trivyReportCrd;
}
