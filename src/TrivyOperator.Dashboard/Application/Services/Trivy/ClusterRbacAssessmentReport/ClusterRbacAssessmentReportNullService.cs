using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterRbacAssessmentReport.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.ClusterRbacAssessmentReport;

public class ClusterRbacAssessmentReportNullService : IClusterRbacAssessmentReportService
{
    public Task<IEnumerable<ClusterRbacAssessmentReportDto>> GetClusterRbacAssessmentReportDtos() =>
        Task.FromResult<IEnumerable<ClusterRbacAssessmentReportDto>>([]);

    public Task<IEnumerable<ClusterRbacAssessmentReportDenormalizedDto>> GetClusterRbacAssessmentReportDenormalizedDtos() =>
        Task.FromResult<IEnumerable<ClusterRbacAssessmentReportDenormalizedDto>>([]);

    public Task<IEnumerable<ClusterRbacAssessmentReportSummaryDto>> GetClusterRbacAssessmentReportSummaryDtos() =>
        Task.FromResult<IEnumerable<ClusterRbacAssessmentReportSummaryDto>>([]);
}
