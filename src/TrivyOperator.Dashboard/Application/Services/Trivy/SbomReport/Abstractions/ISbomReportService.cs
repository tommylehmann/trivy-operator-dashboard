using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;

public interface ISbomReportService
{
    Task<IEnumerable<SbomReportDto>> GetSbomReportDtos(string? namespaceName = null);
    Task<SbomReportDto?> GetSbomReportDtoByUid(Guid uid);
    Task<IEnumerable<string>> GetActiveNamespaces();
}
