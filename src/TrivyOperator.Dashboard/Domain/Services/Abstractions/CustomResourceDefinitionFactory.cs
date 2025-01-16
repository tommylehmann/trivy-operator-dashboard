using TrivyOperator.Dashboard.Domain.Trivy.ClusterComplianceReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterRbacAssessmentReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterSbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterVulnerabilityReport;
using TrivyOperator.Dashboard.Domain.Trivy.ConfigAuditReport;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ExposedSecretReport;
using TrivyOperator.Dashboard.Domain.Trivy.RbacAssessmentReport;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;

namespace TrivyOperator.Dashboard.Domain.Services.Abstractions;

public class CustomResourceDefinitionFactory : ICustomResourceDefinitionFactory
{
    public CustomResourceDefinition Get<TKubernetesObject>()
    {
        if (typeof(TKubernetesObject) == typeof(ClusterComplianceReportCr))
        {
            return new ClusterComplianceReportCrd();
        }

        if (typeof(TKubernetesObject) == typeof(ClusterRbacAssessmentReportCr))
        {
            return new ClusterRbacAssessmentReportCrd();
        }

        if (typeof(TKubernetesObject) == typeof(ClusterSbomReportCr))
        {
            return new ClusterSbomReportCrd();
        }

        if (typeof(TKubernetesObject) == typeof(ClusterVulnerabilityReportCr))
        {
            return new ClusterVulnerabilityReportCrd();
        }

        if (typeof(TKubernetesObject) == typeof(ConfigAuditReportCr))
        {
            return new ConfigAuditReportCrd();
        }

        if (typeof(TKubernetesObject) == typeof(ExposedSecretReportCr))
        {
            return new ExposedSecretReportCrd();
        }

        return typeof(TKubernetesObject) == typeof(RbacAssessmentReportCr)
            ? new RbacAssessmentReportCrd()
            : typeof(TKubernetesObject) == typeof(SbomReportCr)
            ? new SbomReportCrd()
            : typeof(TKubernetesObject) == typeof(VulnerabilityReportCr)
            ? (CustomResourceDefinition)new VulnerabilityReportCrd()
            : throw new InvalidOperationException($"Unsupported Kubernetes object type - {typeof(TKubernetesObject)}");
    }
}
