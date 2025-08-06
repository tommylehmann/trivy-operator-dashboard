using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterSbomReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ClusterSbomReport;

public class ClusterSbomReportNullService : IClusterSbomReportService
{
    public Task<IEnumerable<ClusterSbomReportDto>> GetClusterSbomReportDtos()
        => Task.FromResult<IEnumerable<ClusterSbomReportDto>>([]);
    public Task<IEnumerable<ClusterSbomReportDenormalizedDto>> GetClusterSbomReportDenormalizedDtos() 
        => Task.FromResult<IEnumerable<ClusterSbomReportDenormalizedDto>>([]);
}
