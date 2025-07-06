using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ExposedSecretReport.Abstractions;

public interface IExposedSecretReportService
{
    Task<IEnumerable<string>> GetActiveNamespaces();
    Task<IEnumerable<ExposedSecretReportDenormalizedDto>> GetExposedSecretDenormalizedDtos(string? namespaceName = null);

    Task<IEnumerable<ExposedSecretReportDto>> GetExposedSecretReportDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null);

    public Task<IEnumerable<ExposedSecretReportImageDto>> GetExposedSecretReportImageDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null);

    public Task<IEnumerable<EsSeveritiesByNsSummaryDto>> GetExposedSecretReportSummaryDtos();
}
