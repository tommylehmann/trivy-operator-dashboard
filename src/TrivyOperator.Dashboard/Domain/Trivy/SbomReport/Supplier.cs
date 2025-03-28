using System.Text.Json.Serialization;

namespace TrivyOperator.Dashboard.Domain.Trivy.SbomReport;

public class Supplier
{
    [JsonPropertyName("email")]
    string Email { get; set; } = string.Empty;
    [JsonPropertyName("name")]
    string Name { get; set; } = string.Empty;
    [JsonPropertyName("phone")]
    string Phone { get; set; } = string.Empty;
}
