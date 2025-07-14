using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ConfigAuditReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ConfigAuditReport;

public class ConfigAuditReportNullService : IConfigAuditReportService
{
    public Task<IEnumerable<ConfigAuditReportDto>> GetConfigAuditReportDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null) => Task.FromResult<IEnumerable<ConfigAuditReportDto>>([]);

    public Task<ConfigAuditReportDto?> GetConfigAuditReportDtoByUid(Guid uid) =>
        Task.FromResult<ConfigAuditReportDto?>(null);

    public Task<IEnumerable<ConfigAuditReportDenormalizedDto>> GetConfigAuditReportDenormalizedDtos(
        string? namespaceName = null) => Task.FromResult<IEnumerable<ConfigAuditReportDenormalizedDto>>([]);

    public Task<IEnumerable<string>> GetActiveNamespaces() => Task.FromResult<IEnumerable<string>>([]);

    public Task<IEnumerable<ConfigAuditReportSummaryDto>> GetConfigAuditReportSummaryDtos() =>
        Task.FromResult<IEnumerable<ConfigAuditReportSummaryDto>>([]);
}
