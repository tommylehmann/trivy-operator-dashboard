using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;
public interface ICustomResourceDefinitionFactory
{
    CustomResourceDefinition Get<TKubernetesObject>();
}