using TrivyOperator.Dashboard.Domain.Trivy.ConfigAuditReport;
using TrivyOperator.Dashboard.Domain.Trivy.ExposedSecretReport;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.TrivyReport.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.TrivyReportDependencies;

public class TrivyReportDependency(
    IConcurrentDictionaryCache<ConfigAuditReportCr> carCache,
    IConcurrentDictionaryCache<ExposedSecretReportCr> esrCache,
    IConcurrentDictionaryCache<SbomReportCr> srCache,
    IConcurrentDictionaryCache<VulnerabilityReportCr> vrCache)
{
    public Task<string[]> GetTryvyReportDependencies(string namespaceName, string imageDigest)
    {
        ExposedSecretReportCr[] esrReports = GetTryvyReportsFromCache(esrCache, namespaceName, imageDigest);
        SbomReportCr[] srReports = GetTryvyReportsFromCache(srCache, namespaceName, imageDigest);
        VulnerabilityReportCr[] vrReports = GetTryvyReportsFromCache(vrCache, namespaceName, imageDigest);

        return Task.FromResult<string[]>([]);
    }

    private static T[] GetTryvyReportsFromCache<T>(IConcurrentDictionaryCache<T> cache, string namespaceName, string imageDigest)
        where T : ITrivyReportWithImage
    {
        T[] result = [];
        if (cache.TryGetValue(namespaceName, out var reports))
        {
            result = [.. reports
                .Select(kvp => kvp.Value)
                .Where(tr => tr.ImageArtifact?.Digest == imageDigest)];
        }
        return result;
    }
}
