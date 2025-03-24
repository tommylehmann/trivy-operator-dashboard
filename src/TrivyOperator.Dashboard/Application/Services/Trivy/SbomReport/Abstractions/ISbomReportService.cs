using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;

public interface ISbomReportService
{
    Task<IEnumerable<SbomReportDto>> GetSbomReportDtos(string? namespaceName = null);
    Task<SbomReportDto?> GetFullSbomReportDtoByUid(string uid);
    Task<SbomReportDto?> GetFullSbomReportDtoByUidNamespace(string uid, string namespaceName);
    Task<IEnumerable<string>> GetActiveNamespaces();
}
