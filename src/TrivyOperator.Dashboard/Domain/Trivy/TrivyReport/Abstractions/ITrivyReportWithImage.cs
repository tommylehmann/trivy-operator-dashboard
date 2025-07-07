namespace TrivyOperator.Dashboard.Domain.Trivy.TrivyReport.Abstractions;

public interface ITrivyReportWithImage
{
    IArtifact? ImageArtifact { get; }
    IRegistry? ImageRegistry { get; }
}