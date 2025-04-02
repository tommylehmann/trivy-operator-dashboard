namespace TrivyOperator.Dashboard.Application.Models;

using System.Text.Json.Serialization;
using System.Xml.Serialization;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;

public class CycloneDxBom
{
    [JsonPropertyName("bomFormat")]
    [XmlElement("bomFormat")]
    public string BomFormat { get; set; } = "CycloneDX";

    [JsonPropertyName("specVersion")]
    [XmlElement("specVersion")]
    public string SpecVersion { get; set; } = "1.3";

    [JsonPropertyName("serialNumber")]
    [XmlElement("serialNumber")]
    public string SerialNumber { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    [XmlElement("version")]
    public long Version { get; set; } = 1;

    [JsonPropertyName("metadata")]
    [XmlElement("metadata")]
    public CycloneDxMetadata? Metadata { get; set; }

    [JsonPropertyName("components")]
    [XmlArray("components")]
    [XmlArrayItem("component")]
    public List<CycloneDxComponent> Components { get; set; } = [];

    [JsonPropertyName("dependencies")]
    [XmlArray("dependencies")]
    [XmlArrayItem("dependency")]
    public List<CycloneDxDependency> Dependencies { get; set; } = [];
}

public class CycloneDxMetadata
{
    [JsonPropertyName("timestamp")]
    [XmlElement("timestamp")]
    public DateTime? Timestamp { get; set; }

    [JsonPropertyName("tools")]
    [XmlArray("tools")]
    [XmlArrayItem("tool")]
    public List<CycloneDxTool> Tools { get; set; } = [];

    [JsonPropertyName("component")]
    [XmlElement("component")]
    public CycloneDxComponent? Component { get; set; }
}

public class CycloneDxTool
{
    [JsonPropertyName("name")]
    [XmlElement("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    [XmlElement("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("supplier")]
    [XmlElement("supplier")]
    public string? Supplier { get; set; }
}

public class CycloneDxComponent
{
    [JsonPropertyName("bomRef")]
    [XmlAttribute("bomRef")]
    public string BomRef { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    [XmlElement("type")]
    public string Type { get; set; } = "library";

    [JsonPropertyName("name")]
    [XmlElement("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    [XmlElement("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("licenses")]
    [XmlArray("licenses")]
    [XmlArrayItem("license")]
    public List<CycloneDxLicense>? Licenses { get; set; }

    [JsonPropertyName("properties")]
    [XmlArray("properties")]
    [XmlArrayItem("property")]
    public List<CycloneDxProperty>? Properties { get; set; }

    [JsonPropertyName("purl")]
    [XmlElement("purl")]
    public string Purl { get; set; } = string.Empty;

    [JsonPropertyName("supplier")]
    [XmlElement("supplier")]
    public string? Supplier { get; set; }
}

public class CycloneDxLicense
{
    [JsonPropertyName("id")]
    [XmlElement("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    [XmlElement("name")]
    public string? Name { get; set; }

    [JsonPropertyName("url")]
    [XmlElement("url")]
    public string? Url { get; set; }
}

public class CycloneDxProperty
{
    [JsonPropertyName("name")]
    [XmlAttribute("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    [XmlAttribute("value")]
    public string Value { get; set; } = string.Empty;
}

public class CycloneDxDependency
{
    [JsonPropertyName("ref")]
    [XmlAttribute("ref")]
    public string Ref { get; set; } = string.Empty;

    [JsonPropertyName("dependsOn")]
    [XmlArray("dependsOn")]
    [XmlArrayItem("dependency")]
    public List<string> DependsOn { get; set; } = [];
}


public static partial class SbomReportCrExtensions
{
    public static CycloneDxBom ToCycloneDx(this SbomReportCr sbomReport)
    {
        var bom = new CycloneDxBom
        {
            BomFormat = "CycloneDX",
            SpecVersion = sbomReport.Report?.Components.SpecVersion ?? "1.3",
            SerialNumber = sbomReport.Report?.Components.SerialNumber ?? Guid.NewGuid().ToString(),
            Version = sbomReport.Report?.Components.Version ?? 1,
            Metadata = new CycloneDxMetadata
            {
                Timestamp = sbomReport.Report?.Components.Metadata.Timestamp,
                Tools = [.. sbomReport.Report?.Components.Metadata.Tools.Components.Select(tool => new CycloneDxTool
                {
                    Name = tool.Name,
                    Version = tool.Version,
                    Supplier = tool.Supplier?.Name ?? string.Empty
                }) ?? []],
                Component = new CycloneDxComponent
                {
                    Name = sbomReport.Report?.Artifact.Repository ?? string.Empty,
                    Version = sbomReport.Report?.Artifact.Tag ?? string.Empty,
                    Type = "application",
                    BomRef = sbomReport.Report?.Artifact.Digest ?? string.Empty,
                }
            },
            Components = [.. sbomReport.Report?.Components.ComponentsComponents.Select(comp => new CycloneDxComponent
            {
                Name = comp.Name,
                Version = comp.Version,
                Type = comp.Type ?? "library",
                BomRef = comp.BomRef,
                Properties = [.. comp.Properties.Select(prop => new CycloneDxProperty
                {
                    Name = prop.Name,
                    Value = prop.Value
                })],
                Licenses = [.. comp.Licenses?.Select(lic => new CycloneDxLicense
                {
                    Id = lic.License?.Id,
                    Name = lic.License?.Name,
                    Url = lic.License?.Url
                }) ?? []],
                Supplier = comp.Supplier?.Name,
            }) ?? []],
            Dependencies = [.. sbomReport.Report?.Components.Dependencies.Select(dep => new CycloneDxDependency
            {
                Ref = dep.Ref,
                DependsOn = [.. dep.DependsOn]
            }) ?? []]
        };

        return bom;
    }
}