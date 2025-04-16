using System.Text.Json.Serialization;

namespace TrivyOperator.Dashboard.Infrastructure.Clients.Models;

public class GitHubRelease
{
    [JsonPropertyName("id")]
    public long Id { get; set; } = 0;
    [JsonPropertyName("tag_name")]
    public string? TagName { get; set; }
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("body")]
    public string? Body { get; set; }
    [JsonPropertyName("url")]
    public string? HtmlUrl { get; set; }
    [JsonPropertyName("published_at")]
    public DateTime PublishedAt { get; set; }
    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
    [JsonIgnore]
    public bool IsLatest { get; set; } = false;
}
