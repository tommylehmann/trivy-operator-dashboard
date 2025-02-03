using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport;

public class SbomReportNullService : ISbomReportService
{
    public Task<IEnumerable<SbomReportDto>> GetSbomReportDtos(string? namespaceName = null) =>
        Task.FromResult<IEnumerable<SbomReportDto>>([]);
    public Task<SbomReportDto?> GetSbomReportDtoByUid(Guid uid) =>
        Task.FromResult<SbomReportDto?>(null);
    public Task<SbomReportDto?> GetSbomReportDtoByUidNamespace(Guid uid, string namespaceName) =>
        Task.FromResult<SbomReportDto?>(null);
    public Task<SbomReportDto?> GetSbomReportDtoByResourceName(string namespaceName, string resourceName) =>
        Task.FromResult<SbomReportDto?>(null);
    public Task<IEnumerable<string>> GetActiveNamespaces() =>
        Task.FromResult<IEnumerable<string>>([]);
}
