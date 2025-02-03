using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport;

public class SbomReportService(
    IConcurrentCache<string, IList<SbomReportCr>> cache,
    IConcurrentCache<string, IList<VulnerabilityReportCr>> vrCache,
    INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>> domainService,
    ILogger<SbomReportService> logger)
    : ISbomReportService
{
    public Task<IEnumerable<SbomReportDto>> GetSbomReportDtos(string? namespaceName = null)
    {
        IEnumerable<SbomReportDto> dtos = cache
            .Where(kvp => string.IsNullOrEmpty(namespaceName) || kvp.Key == namespaceName)
            .SelectMany(kvp => kvp.Value.Select(cr => cr.ToSbomReportDto()));

        return Task.FromResult(dtos);
    }

    public async Task<SbomReportDto?> GetSbomReportDtoByUid(Guid uid)
    {
        SbomReportCr? sr = null;

        foreach (string namespaceName in cache.Keys)
        {
            if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
            {
                sr = sbomReportCrs.FirstOrDefault(x => x.Metadata.Uid == uid.ToString());

                if (sr is not null)
                {
                    break;
                }
            }
        }

        if (sr != null)
        {
            try
            {
                SbomReportDto sbomReportDto = (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                    .ToSbomReportDto();
                SetVulnerabilityReportStatistics(sbomReportDto, sr.Metadata.Name);
                return sbomReportDto;
            }
            catch { }
        }

        return null;
    }

    public async Task<SbomReportDto?> GetSbomReportDtoByUidNamespace(Guid uid, string namespaceName)
    {
        SbomReportCr? sr = null;
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            sr = sbomReportCrs.FirstOrDefault(x => x.Metadata.Uid == uid.ToString());
        }
        if (sr != null)
        {
            try
            {
                return (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                    .ToSbomReportDto();
            }
            catch { }
        }
        return null;
    }

    public async Task<SbomReportDto?> GetSbomReportDtoByResourceName(string resourceName, string namespaceName)
    {
        SbomReportCr? sr = null;
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            sr = sbomReportCrs.FirstOrDefault(x => x.Metadata.Name == resourceName);
        }
        if (sr != null)
        {
            try
            {
                return (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                    .ToSbomReportDto();
            }
            catch { }
        }
        return null;
    }

    public Task<IEnumerable<string>> GetActiveNamespaces() =>
        Task.FromResult(cache.Where(x => x.Value.Any()).Select(x => x.Key));

    private void SetVulnerabilityReportStatistics(SbomReportDto sbomReportDto, string resourceMetadateName)
    {
        VulnerabilityReportCr? vr = null;
        if (vrCache.TryGetValue(sbomReportDto.ResourceNamespace, out IList<VulnerabilityReportCr>? vulnerabilityReportCrs))
        {
            vr = vulnerabilityReportCrs.FirstOrDefault(x => x.Metadata.Name == resourceMetadateName);
        }

        if (vr != null)
        {
            var result = vr.Report?.Vulnerabilities?
                .GroupBy(vrd => new { vrd.PackagePurl })
                .Select(g => new
                {
                    g.Key.PackagePurl,
                    CriticalCount = g.Count(vrd => vrd.Severity == TrivySeverity.CRITICAL),
                    HighCount = g.Count(vrd => vrd.Severity == TrivySeverity.HIGH),
                    MediumCount = g.Count(vrd => vrd.Severity == TrivySeverity.MEDIUM),
                    LowCount = g.Count(vrd => vrd.Severity == TrivySeverity.LOW),
                    UnknownCount = g.Count(vrd => vrd.Severity == TrivySeverity.UNKNOWN)
                })
                .ToList() ?? [];

            foreach (var item in result)
            {
                SbomReportDetailDto? sbomReportDetailDto = sbomReportDto.Details?.FirstOrDefault(x => x.Purl == item.PackagePurl);

                if (sbomReportDetailDto != null)
                {
                    sbomReportDetailDto.CriticalCount = item.CriticalCount;
                    sbomReportDetailDto.HighCount = item.HighCount;
                    sbomReportDetailDto.MediumCount = item.MediumCount;
                    sbomReportDetailDto.LowCount = item.LowCount;
                    sbomReportDetailDto.UnknownCount = item.UnknownCount;
                }
                else
                {
                    logger.LogWarning("SbomReportDetailDto not found for package purl {PackagePurl}", item.PackagePurl);
                }
            }
        }
    }
}
