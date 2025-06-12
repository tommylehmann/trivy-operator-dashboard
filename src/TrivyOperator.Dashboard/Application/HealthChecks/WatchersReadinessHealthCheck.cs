using Microsoft.Extensions.Diagnostics.HealthChecks;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.HealthChecks;

public class WatchersReadinessHealthCheck : IHealthCheck
{
    private readonly IConcurrentCache<string, WatcherStateInfo> _cache;

    public WatchersReadinessHealthCheck(IConcurrentCache<string, WatcherStateInfo> cache) => _cache = cache;

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        // TODO: Add logic
        return Task.FromResult(HealthCheckResult.Healthy("App is ready"));
    }
}
