using TrivyOperator.Dashboard.Application.Services.Alerts;

namespace TrivyOperator.Dashboard.Application.Models;

public class AlertDto
{
    public string Emitter { get; init; } = string.Empty;
    public string EmitterKey { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Severity { get; init; } = "Unknown";
}

public static class AlertExtensions
{
    public static AlertDto ToAlertDto(this Alert alert, string emitter) => new()
    {
        Emitter = emitter, EmitterKey = alert.EmitterKey, Message = alert.Message, Severity = alert.Severity.ToString(),
    };
}
