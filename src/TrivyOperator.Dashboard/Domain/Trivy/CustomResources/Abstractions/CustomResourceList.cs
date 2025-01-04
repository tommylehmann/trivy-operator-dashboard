using k8s;
using k8s.Models;
using System.Text.Json.Serialization;

namespace TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;

public class CustomResourceList<T> : KubernetesObject, IItems<T> where T : CustomResource
{
    [JsonPropertyName("metadata")]
    public V1ListMeta? Metadata { get; set; }
    [JsonPropertyName("items")]
    public IList<T> Items { get; set; } = [];
}
