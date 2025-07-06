namespace TrivyOperator.Dashboard.Application.Services.Namespaces.Abstractions;

public interface INamespaceService
{
    Task<IEnumerable<string>> GetKubernetesNamespaces();
}
