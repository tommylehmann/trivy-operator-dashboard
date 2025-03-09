using System.Security.Cryptography;
using System.Text;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;

namespace TrivyOperator.Dashboard.Application.Models;

public class SbomReportDto
{
    public string Uid { get; set; } = Guid.NewGuid().ToString();
    public string ResourceName { get; init; } = string.Empty;
    public string ResourceNamespace { get; init; } = string.Empty;
    public string ResourceKind { get; init; } = string.Empty;
    public string ResourceContainerName { get; init; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string Repository { get; set; } = string.Empty;
    public string RootNodeBomRef { get; set; } = string.Empty;
    public SbomReportDetailDto[] Details { get; set; } = [];
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

public static class SbomReportCrExtensions
{
    public static SbomReportDto ToSbomReportDto(this SbomReportCr sbomReportCr)
    {
        ComponentsComponent[] allComponents = sbomReportCr.Report?.Components.Metadata.Component != null
            ? [.. sbomReportCr.Report?.Components.ComponentsComponents ?? [], sbomReportCr.Report?.Components.Metadata.Component!]
            : [.. sbomReportCr.Report?.Components.ComponentsComponents ?? []];
        
        var componentsGrouped = allComponents
            .GroupBy(component => new { component.Purl, PropertisHash = GetPropertiesHash(component.Properties) })
            .Select(group => new
            {
                group.Key.Purl,
                group.Key.PropertisHash,
                group,
            });

        var toBereplacedBomRefs = componentsGrouped
            .Where(compGroup => compGroup.group.Count() > 1)
            .Select(filteredCompGroup => new 
            {
                filteredCompGroup.Purl, 
                BomRef = filteredCompGroup.group.FirstOrDefault()?.BomRef ?? string.Empty,
                filteredCompGroup.group
            })
            .SelectMany(extGroup => extGroup.group.Where(groupItem => groupItem.BomRef != extGroup.Purl).Select(item => new
            {
                Key = item.BomRef,
                Value = extGroup.BomRef,
            }))
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

        IEnumerable<SbomReportDetailDto> details = componentsGrouped.Select(compGroup =>
        {
            ComponentsComponent component = compGroup.group.FirstOrDefault() ?? new();
            SbomReportDetailDto detailDto = new()
            {
                BomRef = component.BomRef,
                Name = component.Name,
                Purl = component.Purl,
                Version = component.Version,
                DependsOn = sbomReportCr.Report?.Components.Dependencies.FirstOrDefault(x => x.Ref == component.BomRef)?.DependsOn ?? [],
                Properties = component.Properties.Select(x => new[] { x.Name, x.Value }).ToArray(),
            };

            return detailDto;
        });

        SbomReportDto result = new()
        {
            Uid = sbomReportCr.Metadata.Uid,
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
            Repository = sbomReportCr.Report?.Registry?.Server ?? string.Empty,
            RootNodeBomRef = sbomReportCr.Report?.Components.Metadata.Component.BomRef ?? string.Empty,
            Details = [.. details],
        };

        return result;
    }

    private static string GetPropertiesHash(Property[] properties)
    {
        string propValues = string.Join("-", properties.OrderBy(x => x.Name).Select(x => x.Value));
        byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(propValues));
        return BitConverter.ToString(hashBytes);
    }
}