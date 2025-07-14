using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ConfigAuditReport.Abstractions;

public interface IConfigAuditReportService
{
    Task<IEnumerable<ConfigAuditReportDenormalizedDto>> GetConfigAuditReportDenormalizedDtos(string? namespaceName = null);
    Task<ConfigAuditReportDto?> GetConfigAuditReportDtoByUid(Guid uid);
    Task<IEnumerable<ConfigAuditReportDto>> GetConfigAuditReportDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null);
    Task<IEnumerable<string>> GetActiveNamespaces();
    public Task<IEnumerable<ConfigAuditReportSummaryDto>> GetConfigAuditReportSummaryDtos();
}
