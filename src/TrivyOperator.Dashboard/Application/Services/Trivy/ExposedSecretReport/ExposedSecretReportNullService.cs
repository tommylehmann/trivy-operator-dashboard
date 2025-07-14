using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ExposedSecretReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ExposedSecretReport;

public class ExposedSecretReportNullService : IExposedSecretReportService
{
    public Task<IEnumerable<ExposedSecretReportDto>> GetExposedSecretReportDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null) => Task.FromResult<IEnumerable<ExposedSecretReportDto>>([]);

    public Task<IEnumerable<ExposedSecretReportDenormalizedDto>> GetExposedSecretDenormalizedDtos(
        string? namespaceName = null) => Task.FromResult<IEnumerable<ExposedSecretReportDenormalizedDto>>([]);

    public Task<IEnumerable<string>> GetActiveNamespaces() => Task.FromResult<IEnumerable<string>>([]);

    public Task<IEnumerable<ExposedSecretReportImageDto>> GetExposedSecretReportImageDtos(
        string? namespaceName = null,
        IEnumerable<int>? excludedSeverities = null) => Task.FromResult<IEnumerable<ExposedSecretReportImageDto>>([]);

    public Task<ExposedSecretReportImageDto?> GetExposedSecretReportImageDtoByDigestNamespace(string digest, string namespaceName) =>
        Task.FromResult<ExposedSecretReportImageDto?>(null);

    public Task<IEnumerable<EsSeveritiesByNsSummaryDto>> GetExposedSecretReportSummaryDtos() =>
        Task.FromResult<IEnumerable<EsSeveritiesByNsSummaryDto>>([]);
}
