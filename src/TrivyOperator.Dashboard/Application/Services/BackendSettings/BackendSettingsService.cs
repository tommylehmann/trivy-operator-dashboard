using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.BackendSettings.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;

namespace TrivyOperator.Dashboard.Application.Services.BackendSettings;

public class BackendSettingsService(IOptions<KubernetesOptions> options) : IBackendSettingsService
{
    public Task<BackendSettingsDto> GetBackendSettings()
    {
        BackendSettingsDto backendSettingsDto = new() { TrivyReportConfigDtos = [] };

        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "ccr",
                Name = "Cluster Compliance Report",
                Enabled = options.Value.TrivyUseClusterComplianceReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "crar",
                Name = "Cluster RBAC Assessment Report",
                Enabled = options.Value.TrivyUseClusterRbacAssessmentReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "car",
                Name = "Config Audit Report",
                Enabled = options.Value.TrivyUseConfigAuditReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "esr",
                Name = "Exposed Secret Report",
                Enabled = options.Value.TrivyUseExposedSecretReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "vr",
                Name = "Vulnerability Report",
                Enabled = options.Value.TrivyUseVulnerabilityReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "cvr",
                Name = "Cluster Vulnerability Report",
                Enabled = options.Value.TrivyUseClusterVulnerabilityReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "rar",
                Name = "RBAC Assessment Report",
                Enabled = options.Value.TrivyUseRbacAssessmentReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "sr", Name = "SBOM Report", Enabled = options.Value.TrivyUseSbomReport,
            });
        backendSettingsDto.TrivyReportConfigDtos.Add(
            new BackendSettingsTrivyReportConfigDto
            {
                Id = "csr",
                Name = "Cluster SBOM Report",
                Enabled = options.Value.TrivyUseClusterSbomReport,
            });

        return Task.FromResult(backendSettingsDto);
    }
}
