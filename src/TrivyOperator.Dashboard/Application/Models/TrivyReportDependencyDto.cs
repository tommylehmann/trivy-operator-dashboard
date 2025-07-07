namespace TrivyOperator.Dashboard.Application.Models;

public class TrivyReportDependencyDto
{
    public string NamespaceName { get; set; } = string.Empty;
    public string ImageDigest { get; set; } = string.Empty;
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = string.Empty;
    public string ImageRepository { get; set; } = string.Empty;
    public TrivyReportDependencyKubernetesResourceDto[] KubernetesDependencies { get; set; } = [];
}

public class TrivyReportDependencyKubernetesResourceDto
{
    public string ResourceType { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public TrivyReportDependencyDetailDto[] TrivyReportDependencies { get; set; } = [];
}

public class TrivyReportDependencyDetailDto
{
    public string ResourceType { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public int CriticalCount { get; set; } = 0;
    public int HighCount { get; set; } = 0;
    public int MediumCount { get; set; } = 0;
    public int LowCount { get; set; } = 0;
    public int UnknownCount { get; set; } = 0;
}
