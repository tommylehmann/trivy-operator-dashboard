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
        if (customResourceDefinition == null)
        {
            var crdMap = new Dictionary<Type, CustomResourceDefinition> {
                { typeof(ClusterComplianceReportCr), new ClusterComplianceReportCrd() },
                { typeof(ClusterRbacAssessmentReportCr), new ClusterRbacAssessmentReportCrd() },
                { typeof(ClusterSbomReportCr), new ClusterSbomReportCrd() },
                { typeof(ClusterVulnerabilityReportCr), new ClusterVulnerabilityReportCrd() },
                { typeof(ConfigAuditReportCr), new ConfigAuditReportCrd() },
                { typeof(ExposedSecretReportCr), new ExposedSecretReportCrd() },
                { typeof(RbacAssessmentReportCr), new RbacAssessmentReportCrd() },
                { typeof(SbomReportCr), new SbomReportCrd() },
                { typeof(VulnerabilityReportCr), new VulnerabilityReportCrd() },
            };
            if (!crdMap.TryGetValue(typeof(TKubernetesObject), out customResourceDefinition))
            {
                throw new InvalidOperationException($"Unsupported Kubernetes object type - {typeof(TKubernetesObject)}");
            }
        }
        return customResourceDefinition;
    }

    private CustomResourceDefinition? customResourceDefinition;
}
