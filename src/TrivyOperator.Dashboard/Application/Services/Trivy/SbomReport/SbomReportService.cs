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

    public Task<IEnumerable<SbomReportImageDto>> GetSbomReportImageDtos(string? namespaceName = null)
    {
        SbomReportImageDto[] dtos = [.. cache
            .Where(kvp => string.IsNullOrEmpty(namespaceName) || kvp.Key == namespaceName)
            .SelectMany(kvp => kvp.Value.GroupBy(sbom => sbom.Report?.Artifact?.Digest)
                    .Select(group => group.ToSbomReportImageDto()))];
        var vrDigests = vrCache
            .Where(kvp => string.IsNullOrEmpty(namespaceName) || kvp.Key == namespaceName)
            .SelectMany(kvp => kvp.Value.GroupBy(vr => new 
            {
                ImageDigest = vr.Report?.Artifact?.Digest ?? string.Empty,
                ResourceNamespace = vr.Metadata.NamespaceProperty
            })
            .Select(group => group.Key));
        SbomReportImageDto[] sbomsWithVrs = [.. dtos
            .Join(
                vrDigests,
                left => new { left.ImageDigest, left.ResourceNamespace },
                right => new { right.ImageDigest, right.ResourceNamespace },
                (left, right) => left
            )];

        foreach (var dto in dtos)
        {
            dto.HasVulnerabilities = sbomsWithVrs.Contains(dto);
        }

        return Task.FromResult((IEnumerable<SbomReportImageDto>)dtos);
    }

    public async Task<SbomReportDto?> GetFullSbomReportDtoByUid(string uid)
    {
        foreach (string namespaceName in cache.Keys)
        {
            SbomReportDto? sr = await GetFullSbomReportDtoByUidNamespace(uid, namespaceName);
            if (sr != null)
            {
                return sr;
            }
        }
        return null;
    }

    public async Task<SbomReportDto?> GetFullSbomReportDtoByUidNamespace(string uid, string namespaceName)
    {
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            SbomReportCr? sr = sbomReportCrs.FirstOrDefault(x => x.Metadata.Uid == uid);
            if (sr != null)
            {
                try
                {
                    SbomReportDto sbomReportDto = (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                                .ToSbomReportDto();
                    SetVulnerabilityReportStatistics(sbomReportDto);
                    return sbomReportDto;
                }
                catch { }
            }
        }
        return null;
    }

    public async Task<SbomReportDto?> GetFullSbomReportDtoByDigestNamespace(string digest, string namespaceName)
    {
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            SbomReportCr? x = sbomReportCrs
                .Where(x => x.Report?.Artifact?.Digest == digest)
                .Aggregate((SbomReportCr?)null, (max, current) =>
                    max == null || current?.Metadata.CreationTimestamp > max.Metadata.CreationTimestamp ? current : max);
            if (x != null)
            {
                return await GetFullSbomReportDtoByUidNamespace(x.Metadata.Uid, namespaceName);
            }
        }
        return null;
    }


    public Task<IEnumerable<string>> GetActiveNamespaces() =>
        Task.FromResult(cache.Where(x => x.Value.Any()).Select(x => x.Key));

    private void SetVulnerabilityReportStatistics(SbomReportDto sbomReportDto)
    {
        VulnerabilityReportCr? vr = null;
        if (vrCache.TryGetValue(sbomReportDto.ResourceNamespace, out IList<VulnerabilityReportCr>? vulnerabilityReportCrs))
        {
            vr = vulnerabilityReportCrs.FirstOrDefault(x => x.Report?.Artifact?.Digest == sbomReportDto.ImageDigest);
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
                .ToArray() ?? [];

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
                    logger.LogWarning("SbomReportDetailDto not found for package purl {PackagePurl}, in {SbomResourceName} - {NamespaceName}",
                        item.PackagePurl,
                        sbomReportDto.ResourceName,
                        sbomReportDto.ResourceNamespace);
                }
            }
        }
    }
}
