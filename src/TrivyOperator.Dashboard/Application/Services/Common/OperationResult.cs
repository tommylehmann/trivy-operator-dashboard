namespace TrivyOperator.Dashboard.Application.Services.Common;

public class OperationResult
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public IDictionary<string, object>? Metadata { get; init; }
}
