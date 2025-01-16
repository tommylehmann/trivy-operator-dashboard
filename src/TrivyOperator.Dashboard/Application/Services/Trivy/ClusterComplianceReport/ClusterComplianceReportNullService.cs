using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport;

public class ClusterComplianceReportNullService : IClusterComplianceReportService
{
    public Task<IEnumerable<ClusterComplianceReportDto>> GetClusterComplianceReportDtos() =>
        Task.FromResult<IEnumerable<ClusterComplianceReportDto>>([]);

    public Task<IEnumerable<ClusterComplianceReportDenormalizedDto>> GetClusterComplianceReportDenormalizedDtos() =>
        Task.FromResult<IEnumerable<ClusterComplianceReportDenormalizedDto>>([]);
}
