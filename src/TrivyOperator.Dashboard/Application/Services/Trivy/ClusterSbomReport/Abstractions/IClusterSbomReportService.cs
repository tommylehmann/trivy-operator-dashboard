using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ClusterSbomReport.Abstractions;

public interface IClusterSbomReportService
{
    Task<IEnumerable<ClusterSbomReportDto>> GetClusterSbomReportDtos();
}
