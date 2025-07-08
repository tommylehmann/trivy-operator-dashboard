using TrivyOperator.Dashboard.Application.Models;
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
    public Task<TrivyReportDependencyDto> GetTryvyReportDependencies(string namespaceName, string imageDigest)
    {
        ExposedSecretReportCr[] esrReports = GetTrivyReportsFromCache(esrCache, namespaceName, imageDigest);
        SbomReportCr[] srReports = GetTrivyReportsFromCache(srCache, namespaceName, imageDigest);
        VulnerabilityReportCr[] vrReports = GetTrivyReportsFromCache(vrCache, namespaceName, imageDigest);
        ConfigAuditReportCr[] carReports = carCache.TryGetValue(namespaceName, out var carCacheValue)
            ? [.. carCacheValue.Select(x => x.Value)]
            : [];

        // Convert all digest-based reports to bindings
        var digestBindings = esrReports
            .Select(r => r.ToTrivyReportDependencyKubernetesResourceBindingDto())
            .Concat(srReports.Select(r => r.ToTrivyReportDependencyKubernetesResourceBindingDto()))
            .Concat(vrReports.Select(r => r.ToTrivyReportDependencyKubernetesResourceBindingDto()));

        // Group by Kubernetes resource
        var groupedByResource = digestBindings
            .GroupBy(x => x.KubernetesResource)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.TrivyReportDependency).ToList()
            );

        // Add config audit reports only if their Kubernetes resource exists in image-based groupings
        foreach (var car in carReports)
        {
            var binding = car.ToTrivyReportDependencyKubernetesResourceBindingDto();
            var resource = binding.KubernetesResource;

            // Match only with resources already collected
            if (groupedByResource.TryGetValue(resource, out var reportList))
            {
                reportList.Add(binding.TrivyReportDependency);
            }
        }

        // Build final output
        var finalLinks = groupedByResource
            .Select(kvp => new TrivyReportDependencyKubernetesResourceLinkDto
            {
                KubernetesResource = kvp.Key,
                TrivyReportDependencies = kvp.Value.ToArray()
            })
            .ToArray();



        var x = new TrivyReportDependencyDto();

        return Task.FromResult(x);
    }

    private static T[] GetTrivyReportsFromCache<T>(IConcurrentDictionaryCache<T> cache, string namespaceName, string imageDigest)
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
