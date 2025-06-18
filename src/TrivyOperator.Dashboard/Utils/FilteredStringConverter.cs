using System.Text.Json;
using System.Text.Json.Serialization;

namespace TrivyOperator.Dashboard.Utils;

public class FilteredStringConverter(string filter, string filterWith) : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.GetString() ?? string.Empty;

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
    {
        string? filtered = value?.Replace(filter, filterWith);
        writer.WriteStringValue(filtered);
    }
}
