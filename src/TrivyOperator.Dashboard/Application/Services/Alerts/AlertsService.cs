using Microsoft.AspNetCore.SignalR;
using TrivyOperator.Dashboard.Application.Hubs;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.Services.Alerts;

public class AlertsService(
    IListConcurrentCache<Alert> cache,
    IHubContext<AlertsHub> alertsHubContext,
    ILogger<AlertsService> logger) : IAlertsService
{
    public async Task AddAlert(string emitter, Alert alert, CancellationToken cancellationToken)
    {
        cache.TryGetValue(emitter, out IList<Alert>? alerts);
        if (alerts != null && alerts.Any(x => x.EmitterKey == alert.EmitterKey))
        {
            return;
        }

        if (alerts == null)
        {
            alerts = [];
            alerts.Add(alert);
            cache.TryAdd(emitter, alerts);
        }
        else
        {
            alerts.Add(alert);
        }

        await alertsHubContext.Clients.All.SendAsync("ReceiveAddedAlert", alert.ToAlertDto(emitter), cancellationToken);

        logger.LogDebug("Added alert for {emitter} and {emitterKey} with severity {alertSeverity}.",
            emitter,
            alert.EmitterKey,
            alert.Severity);
    }

    public async Task RemoveAlert(string emitter, Alert alert, CancellationToken cancellationToken)
    {
        cache.TryGetValue(emitter, out IList<Alert>? alerts);
        if (alerts != null)
        {
            if (alerts.FirstOrDefault(x => x.EmitterKey == alert.EmitterKey) is not null)
            {
                RemoveAlertByKey(alerts, alert.EmitterKey);
            }
        }

        await alertsHubContext.Clients.All.SendAsync("ReceiveRemovedAlert", alert.ToAlertDto(emitter), cancellationToken);

        logger.LogDebug($"Removed alert for {emitter} and {alert.EmitterKey}.");
    }

    public Task<IList<AlertDto>> GetAlertDtos()
    {
        IEnumerable<AlertDto> result = cache.Where(kvp => kvp.Value.Any())
            .SelectMany(kvp => kvp.Value.Select(alert => alert.ToAlertDto(kvp.Key)));

        return Task.FromResult<IList<AlertDto>>([.. result,]);
    }

    private static void RemoveAlertByKey(IList<Alert> alerts, string key)
    {
        for (int i = alerts.Count - 1; i >= 0; i--)
        {
            if (alerts[i].EmitterKey == key)
            {
                alerts.RemoveAt(i);
            }
        }
    }
}
