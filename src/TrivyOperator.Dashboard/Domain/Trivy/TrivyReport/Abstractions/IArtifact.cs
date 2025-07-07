namespace TrivyOperator.Dashboard.Domain.Trivy.TrivyReport.Abstractions;

public interface IArtifact
{
    string Digest { get; init; }
    string Repository { get; init; }
    string Tag { get; init; }
}