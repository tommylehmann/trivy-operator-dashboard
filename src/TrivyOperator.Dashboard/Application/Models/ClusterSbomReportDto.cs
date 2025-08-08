using System.Web;
using TrivyOperator.Dashboard.Application.Models.Abstracts;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterSbomReport;
using TrivyOperator.Dashboard.Utils;

namespace TrivyOperator.Dashboard.Application.Models;

public class ClusterSbomReportDto : ISbomReportDto<ClusterSbomReportDetailDto>
{
    public Guid Uid { get; set; } = Guid.NewGuid();
    public DateTime UpdateTimestamp { get; set; } = DateTime.MinValue;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string ImageRepository { get; set; } = string.Empty;
    public string RootNodeBomRef { get; set; } = string.Empty;
    public bool HasVulnerabilities { get; set; } = false;
    public long CriticalCount { get; set; } = -1;
    public long HighCount { get; set; } = -1;
    public long MediumCount { get; set; } = -1;
    public long LowCount { get; set; } = -1;
    public long UnknownCount { get; set; } = -1;
    public ClusterSbomReportDetailDto[] Details { get; set; } = [];
}

public class ClusterSbomReportDetailDto : ISBomReportDetailDto
{
    public Guid Id => GuidUtils.GetDeterministicGuid(Purl);
    public Guid MatchKey => GuidUtils.GetDeterministicGuid($"{(string.IsNullOrEmpty(Purl.Split('@')[0]) ? Name : Purl.Split('@')[0])}");
    public string BomRef { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Purl { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string[] DependsOn { get; set; } = [];
    public string[][] Properties { get; set; } = [];
    public long CriticalCount { get; set; } = -1;
    public long HighCount { get; set; } = -1;
    public long MediumCount { get; set; } = -1;
    public long LowCount { get; set; } = -1;
    public long UnknownCount { get; set; } = -1;
}

public class ClusterSbomReportDenormalizedDto
{
    public Guid Uid => Guid.NewGuid();
    public DateTime CreationTimestamp { get; set; } = DateTime.MinValue;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string ImageRepository { get; set; } = string.Empty;
    public string RootNodeBomRef { get; set; } = string.Empty;
    public string BomRef { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Purl { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public long DependenciesCount { get; set; } = 0;
    public long PropertiesCount { get; set; } = 0;
}

public static class ClusterSbomReportCrExtensions
{
    public static ClusterSbomReportDto ToClusterSbomReportDto(this ClusterSbomReportCr clusterSbomReportCr)
    {
        ComponentsComponent[] allComponents = GetAllComponents(clusterSbomReportCr);

        IEnumerable<ClusterSbomReportDetailDto> details = allComponents.Select(component =>
        {
            ClusterSbomReportDetailDto detailDto = new()
            {
                BomRef = component.BomRef,
                Name = component.Name,
                Purl = component.Purl,
                Version = component.Version,
                DependsOn = clusterSbomReportCr.Report?.Components.Dependencies.FirstOrDefault(x => x.Ref == component.BomRef)?.DependsOn ?? [],
                Properties = [.. component.Properties.Select(x => new[] { x.Name.Replace("aquasecurity:trivy:", string.Empty), x.Value })],
            };

            return detailDto;
        });

        ClusterSbomReportDto result = new()
        {
            Uid = Guid.TryParse(clusterSbomReportCr.Metadata.Uid, out Guid parsedGuid)
                ? parsedGuid
                : new(),
            UpdateTimestamp = clusterSbomReportCr.Report?.UpdateTimestamp ?? DateTime.MinValue,
            ImageName = clusterSbomReportCr.Report?.Artifact?.Repository ?? string.Empty,
            ImageTag = clusterSbomReportCr.Report?.Artifact?.Tag ?? string.Empty,
            ImageRepository = clusterSbomReportCr.Report?.Registry?.Server ?? string.Empty,
            RootNodeBomRef = clusterSbomReportCr.Report?.Components.Metadata.Component.BomRef ?? string.Empty,
            Details = [.. details],
        };
        SbomReportCrExtensions.CleanupPurlsFromBomRefs(result);

        return result;

    }

    public static IEnumerable<ClusterSbomReportDenormalizedDto> ToClusterSbomReportDenormalizedDtos(this ClusterSbomReportCr clusterSbomReportCr)
    {
        ComponentsComponent[] allComponents = GetAllComponents(clusterSbomReportCr);

        IEnumerable<ClusterSbomReportDenormalizedDto> result = allComponents.Select(component =>
        {
            ClusterSbomReportDenormalizedDto detailDto = new()
            {
                CreationTimestamp = clusterSbomReportCr.Metadata.CreationTimestamp ?? DateTime.MinValue,
                ImageName = clusterSbomReportCr.Report?.Artifact?.Repository ?? string.Empty,
                ImageTag = clusterSbomReportCr.Report?.Artifact?.Tag ?? string.Empty,
                ImageRepository = clusterSbomReportCr.Report?.Registry?.Server ?? string.Empty,
                RootNodeBomRef = clusterSbomReportCr.Report?.Components.Metadata.Component.BomRef ?? string.Empty,

                BomRef = component.BomRef,
                Name = component.Name,
                Purl = component.Purl,
                Version = component.Version,
                DependenciesCount = clusterSbomReportCr.Report?.Components.Dependencies.FirstOrDefault(x => x.Ref == component.BomRef)?.DependsOn.Length ?? 0,
                PropertiesCount = component.Properties.Length
            };
            return detailDto;
        });

        return result;
    }

    private static ComponentsComponent[] GetAllComponents(ClusterSbomReportCr clusterSbomReportCr) =>
        clusterSbomReportCr.Report?.Components.Metadata.Component != null
            ? [.. clusterSbomReportCr.Report?.Components.ComponentsComponents ?? [], clusterSbomReportCr.Report?.Components.Metadata.Component!]
            : [.. clusterSbomReportCr.Report?.Components.ComponentsComponents ?? []];
}
