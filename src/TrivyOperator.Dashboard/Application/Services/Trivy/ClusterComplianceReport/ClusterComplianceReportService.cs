using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterComplianceReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport;

public class ClusterComplianceReportService(IConcurrentDictionaryCache<ClusterComplianceReportCr> cache)
    : IClusterComplianceReportService
{
    public Task<IEnumerable<ClusterComplianceReportDto>> GetClusterComplianceReportDtos()
    {
        IEnumerable<ClusterComplianceReportCr> cachedValues = [.. cache.SelectMany(kvp => kvp.Value.Values),];
        IEnumerable<ClusterComplianceReportDto> values = cachedValues
            .Select(x => x.ToClusterComplianceReportDto());

        return Task.FromResult(values);
    }

    public Task<IEnumerable<ClusterComplianceReportDenormalizedDto>> GetClusterComplianceReportDenormalizedDtos()
    {
        IEnumerable<ClusterComplianceReportCr> cachedValues = [.. cache.SelectMany(kvp => kvp.Value.Values),];
        IEnumerable<ClusterComplianceReportDenormalizedDto> values = cachedValues
            .SelectMany(x => x.ToClusterComplianceReportDenormalizedDto());

        return Task.FromResult(values);
    }
}
