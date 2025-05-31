using Microsoft.Extensions.Options;
using System.IO.Compression;
using System.Text.Json;
using System.Text.RegularExpressions;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport;

public class SbomReportService(
    IListConcurrentCache<SbomReportCr> cache,
    IListConcurrentCache<VulnerabilityReportCr> vrCache,
    INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>> domainService,
    IOptions<FileExportOptions> fileExportOptions,
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
        string? imageDigest = "sha256:38a9f7eb75f7015ae9b4bc5c6fcdd232e4912cd791fd3940dbfd2b1b0cce2230";
        var vrDigests = vrCache
            .Where(kvp => string.IsNullOrEmpty(namespaceName) || kvp.Key == namespaceName)
            .SelectMany(kvp => kvp.Value
            .Where(vr => string.IsNullOrEmpty(imageDigest) || vr.Report?.Artifact?.Digest == imageDigest)
            .GroupBy(vr => new
            {
                ImageDigest = vr.Report?.Artifact?.Digest ?? string.Empty,
                ResourceNamespace = vr.Metadata.NamespaceProperty
            })
            .Select(group => new {
                group.Key.ImageDigest,
                group.Key.ResourceNamespace,
                CriticalCount = group.FirstOrDefault()?.Report?.Summary?.CriticalCount ?? -1,
                HighCount = group.FirstOrDefault()?.Report?.Summary?.HighCount ?? -1,
                MediumCount = group.FirstOrDefault()?.Report?.Summary?.MediumCount ?? -1,
                LowCount = group.FirstOrDefault()?.Report?.Summary?.LowCount ?? -1,
                UnknownCount = group.FirstOrDefault()?.Report?.Summary?.UnknownCount ?? -1
            }));
        SbomReportImageDto[] dtos = [.. cache
            .Where(kvp => string.IsNullOrEmpty(namespaceName) || kvp.Key == namespaceName)
            .SelectMany(kvp => kvp.Value
            .Where(vr => string.IsNullOrEmpty(imageDigest) || vr.Report?.Artifact?.Digest == imageDigest)
            .GroupBy(sbom => sbom.Report?.Artifact?.Digest)
                .Select(group => group.ToSbomReportImageDto()))
            .GroupJoin(
                vrDigests,
                dto => new { dto.ImageDigest, dto.ResourceNamespace },
                vr => new { vr.ImageDigest, vr.ResourceNamespace },
                (dto, vrMatches) =>
                {
                    var vr = vrMatches.FirstOrDefault();
                    dto.HasVulnerabilities = vr != null;
                    dto.CriticalCount = vr?.CriticalCount ?? -1;
                    dto.HighCount = vr?.HighCount ?? -1;
                    dto.MediumCount = vr?.MediumCount ?? -1;
                    dto.LowCount = vr?.LowCount ?? -1;
                    dto.UnknownCount = vr?.UnknownCount ?? -1;

                    return dto;
                })];

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

    public async Task<CycloneDxBom?> GetCycloneDxBomByDigestNamespace(string digest, string namespaceName)
    {
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            SbomReportCr? sr = sbomReportCrs
                .Where(x => x.Report?.Artifact?.Digest == digest)
                .Aggregate((SbomReportCr?)null, (max, current) =>
                    max == null || current?.Metadata.CreationTimestamp > max.Metadata.CreationTimestamp ? current : max);
            if (sr != null)
            {
                try
                {
                    CycloneDxBom cycloneDx = (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                                .ToCycloneDx();
                    return cycloneDx;
                }
                catch { }
            }
        }
        return null;
    }

    public async Task<SpdxBom?> GetSpdxBomByDigestNamespace(string digest, string namespaceName)
    {
        if (cache.TryGetValue(namespaceName, out IList<SbomReportCr>? sbomReportCrs))
        {
            SbomReportCr? sr = sbomReportCrs
                .Where(x => x.Report?.Artifact?.Digest == digest)
                .Aggregate((SbomReportCr?)null, (max, current) =>
                    max == null || current?.Metadata.CreationTimestamp > max.Metadata.CreationTimestamp ? current : max);
            if (sr != null)
            {
                try
                {
                    SpdxBom spdx = (await domainService.GetResource(sr.Metadata.Name, sr.Metadata.NamespaceProperty))
                                .ToSpdx();
                    return spdx;
                }
                catch { }
            }
        }
        return null;
    }

    public async Task<string> CreateCycloneDxExportZipFile(SbomReportExportDto[] exportSboms, string fileType = "json")
    {
        try
        {
            Guid fileNameGuid = Guid.NewGuid();
            string zipFileName = Path.Combine(fileExportOptions.Value.TempFolder, $"{fileNameGuid}_sbom.zip");

            using (var zipFileStream = new FileStream(zipFileName, FileMode.Create))
            using (var archive = new ZipArchive(zipFileStream, ZipArchiveMode.Create))
            {
                foreach (SbomReportExportDto exportSbom in exportSboms)
                {
                    CycloneDxBom? cycloneDxBom = await GetCycloneDxBomByDigestNamespace(exportSbom.Digest, exportSbom.NamespaceName);

                    if (cycloneDxBom == null)
                    {
                        logger.LogWarning("CycloneDxBom not found for {Digest} in {NamespaceName}",
                            exportSbom.Digest, exportSbom.NamespaceName);
                        continue;
                    }
                    string imageName = cycloneDxBom.Metadata?.Component?.Name ?? string.Empty;
                    string imageVersion = cycloneDxBom.Metadata?.Component?.Version ?? string.Empty;
                    string fileExtension = fileType.ToLower() == "json" ? "json" : "xml";
                    string fileName = InvalidFileNameCharsRegex.Replace(
                        $"{exportSbom.NamespaceName}_{imageName}_{imageVersion}_{exportSbom.Digest}.${fileExtension}", "_");
                    using var stream = archive.CreateEntry(fileName).Open();
                    if (fileType == "json")
                    {
                        JsonSerializer.Serialize(stream, cycloneDxBom);
                    }
                    else
                    {
                        var serializer = new System.Xml.Serialization.XmlSerializer(cycloneDxBom.GetType());
                        serializer.Serialize(stream, cycloneDxBom);
                    }
                }
            }

            return zipFileName;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating zip file - {exceptionMessage}", ex.Message);
            return string.Empty;
        }
    }

    public void CleanupFile(string fileName)
    {
        try
        {
            if (File.Exists(fileName))
            {
                File.Delete(fileName);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting file - {exceptionMessage}", ex.Message);
        }
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
    
    private static readonly Regex InvalidFileNameCharsRegex = new(
        $"[{Regex.Escape(new string(Path.GetInvalidFileNameChars()))}]",
        RegexOptions.Compiled );
}
