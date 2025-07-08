using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.TrivyReportDependencies.Abstractions;
public interface ITrivyReportDependency
{
    Task<TrivyReportDependencyDto?> GetTryvyReportDependencies(string imageDigest, string namespaceName);
}