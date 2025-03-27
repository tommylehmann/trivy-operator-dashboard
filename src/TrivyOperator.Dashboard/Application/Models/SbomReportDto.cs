using System.Security.Cryptography;
using System.Text;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;

namespace TrivyOperator.Dashboard.Application.Models;

public class SbomReportDto : ISbomReportDto
{
    public string Uid { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreationTimestamp { get; set; } = DateTime.MinValue;
    public string ResourceName { get; init; } = string.Empty;
    public string ResourceNamespace { get; init; } = string.Empty;
    public string ResourceKind { get; init; } = string.Empty;
    public string ResourceContainerName { get; init; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string ImageDigest { get; set; } = string.Empty;
    public string Repository { get; set; } = string.Empty;
    public string RootNodeBomRef { get; set; } = string.Empty;
    public SbomReportDetailDto[] Details { get; set; } = [];
}

public class SbomReportImageDto : ISbomReportDto
{
    public string Uid { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreationTimestamp { get; set; } = DateTime.MinValue;
    public string ResourceNamespace { get; init; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string ImageDigest { get; set; } = string.Empty;
    public string Repository { get; set; } = string.Empty;
    public SbomReportImageResourceDto[] Resources { get; set; } = [];
    public string RootNodeBomRef { get; set; } = string.Empty;
    public bool HasVulnerabilities { get; set; } = false;
    public SbomReportDetailDto[] Details { get; set; } = [];
}

public class SbomReportImageResourceDto
{
    public string Name { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty;
    public string ContainerName { get; init; } = string.Empty;
}

public class SbomReportDetailDto
{
    public string BomRef { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Purl { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string[] DependsOn { get; set; } = [];
    public string[][] Properties { get; set; } = [];
    public long CriticalCount { get; set; } = 0;
    public long HighCount { get; set; } = 0;
    public long MediumCount { get; set; } = 0;
    public long LowCount { get; set; } = 0;
    public long UnknownCount { get; set; } = 0;
}

public interface ISbomReportDto
{
    string RootNodeBomRef { get; set; }
    SbomReportDetailDto[] Details { get; set; }
}

public static class SbomReportCrExtensions
{
    public static SbomReportDto ToSbomReportDto(this SbomReportCr sbomReportCr)
    {
        ComponentsComponent[] allComponents = sbomReportCr.Report?.Components.Metadata.Component != null
            ? [.. sbomReportCr.Report?.Components.ComponentsComponents ?? [], sbomReportCr.Report?.Components.Metadata.Component!]
            : [.. sbomReportCr.Report?.Components.ComponentsComponents ?? []];
        
        IEnumerable<SbomReportDetailDto> details = allComponents.Select(component =>
        {
            SbomReportDetailDto detailDto = new()
            {
                BomRef = component.BomRef,
                Name = component.Name,
                Purl = component.Purl,
                Version = component.Version,
                DependsOn = sbomReportCr.Report?.Components.Dependencies.FirstOrDefault(x => x.Ref == component.BomRef)?.DependsOn ?? [],
                Properties = [.. component.Properties.Select(x => new[] { x.Name, x.Value })],
            };

            return detailDto;
        });

        SbomReportDto result = new()
        {
            Uid = sbomReportCr.Metadata.Uid,
            CreationTimestamp = sbomReportCr.Metadata.CreationTimestamp ?? DateTime.MinValue,
            ResourceName =
                sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue("trivy-operator.resource.name", out string? resourceName)
                    ? resourceName
                    : string.Empty,
            ResourceNamespace =
                sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue(
                    "trivy-operator.resource.namespace",
                    out string? resourceNamespace)
                    ? resourceNamespace
                    : string.Empty,
            ResourceKind =
                sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue("trivy-operator.resource.kind", out string? resourceKind)
                    ? resourceKind
                    : string.Empty,
            ResourceContainerName =
                sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue(
                    "trivy-operator.container.name",
                    out string? resourceContainerName)
                    ? resourceContainerName
                    : string.Empty,
            ImageName = sbomReportCr.Report?.Artifact?.Repository ?? string.Empty,
            ImageTag = sbomReportCr.Report?.Artifact?.Tag ?? string.Empty,
            ImageDigest = sbomReportCr.Report?.Artifact?.Digest ?? string.Empty,
            Repository = sbomReportCr.Report?.Registry?.Server ?? string.Empty,
            RootNodeBomRef = sbomReportCr.Report?.Components.Metadata.Component.BomRef ?? string.Empty,
            Details = [.. details],
        };
        CleanupPurlsFromBomRefs(result);

        return result;
    }

    public static SbomReportImageDto ToSbomReportImageDto(this IGrouping<string?, SbomReportCr> groupedSbomReportCr)
    {
        SbomReportCr[] sbomReportCrs = [.. groupedSbomReportCr];
        SbomReportCr firstSbomReportCr = sbomReportCrs.First();
        ComponentsComponent[] allComponents = firstSbomReportCr.Report?.Components.Metadata.Component != null
            ? [.. firstSbomReportCr.Report?.Components.ComponentsComponents ?? [], firstSbomReportCr.Report?.Components.Metadata.Component!]
            : [.. firstSbomReportCr.Report?.Components.ComponentsComponents ?? []];
        IEnumerable<SbomReportDetailDto> details = allComponents.Select(component =>
        {
            SbomReportDetailDto detailDto = new()
            {
                BomRef = component.BomRef,
                Name = component.Name,
                Purl = component.Purl,
                Version = component.Version,
                DependsOn = firstSbomReportCr.Report?.Components.Dependencies.FirstOrDefault(x => x.Ref == component.BomRef)?.DependsOn ?? [],
                Properties = [.. component.Properties.Select(x => new[] { x.Name, x.Value })],
            };
            return detailDto;
        });
        SbomReportImageDto result = new()
        {
            Uid = Guid.NewGuid().ToString(),
            CreationTimestamp = firstSbomReportCr.Metadata.CreationTimestamp ?? DateTime.MinValue,
            ResourceNamespace = firstSbomReportCr.Metadata.NamespaceProperty,
            ImageName = firstSbomReportCr.Report?.Artifact?.Repository ?? string.Empty,
            ImageTag = firstSbomReportCr.Report?.Artifact?.Tag ?? string.Empty,
            ImageDigest = firstSbomReportCr.Report?.Artifact?.Digest ?? string.Empty,
            Repository = firstSbomReportCr.Report?.Registry?.Server ?? string.Empty,
            Resources = [.. sbomReportCrs.Select(sbomReportCr => new SbomReportImageResourceDto
            {
                Name = sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue("trivy-operator.resource.name", out string? resourceName)
                    ? resourceName
                    : string.Empty,
                Kind = sbomReportCr.Metadata.Labels != null &&
                sbomReportCr.Metadata.Labels.TryGetValue("trivy-operator.resource.kind", out string? resourceKind)
                    ? resourceKind
                    : string.Empty,
                ContainerName = sbomReportCr.Metadata.Labels != null &&
                                sbomReportCr.Metadata.Labels.TryGetValue("trivy-operator.container.name", out string? containerName)
                    ? containerName
                    : string.Empty,
            })],
            RootNodeBomRef = firstSbomReportCr.Report?.Components.Metadata.Component.BomRef ?? string.Empty,
            Details = [.. details],
        };
        CleanupPurlsFromBomRefs(result);
        return result;
    }

    private static void CleanupPurlsFromBomRefs(ISbomReportDto sbomReportDto)
    {
        var nonGuidToGuidMap = sbomReportDto.Details
            .Where(d => !Guid.TryParse(d.BomRef, out _))
            .ToDictionary(d => d.BomRef, d => Guid.NewGuid().ToString());

        foreach (var detail in sbomReportDto.Details)
        {
            if (nonGuidToGuidMap.TryGetValue(detail.BomRef, out string? valueFroBomRef))
            {
                detail.BomRef = valueFroBomRef;
            }

            for (int i = 0; i < detail.DependsOn.Length; i++)
            {
                if (nonGuidToGuidMap.TryGetValue(detail.DependsOn[i], out string? valueFroDependsOn))
                {
                    detail.DependsOn[i] = valueFroDependsOn;
                }
            }
        }
        if (nonGuidToGuidMap.TryGetValue(sbomReportDto.RootNodeBomRef, out string? valueFroRootNodeBomRef))
        {
            sbomReportDto.RootNodeBomRef = valueFroRootNodeBomRef;
        }
    }
}