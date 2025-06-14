using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;

namespace TrivyOperator.Dashboard.Application.HealthChecks;

public class WatchersLivenessHealthCheck(
    IConcurrentCache<string, WatcherStateInfo> cache,
    IOptions<WatchersOptions> options
    ILogger<WatchersLivenessHealthCheck> logger) : IHealthCheck
{
    private readonly int timeFrameInSeconds = (int)((options.Value.WatchTimeoutInSeconds * 1.1) + 120);
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {

        try
        {
            bool isAnyWatcherStale = cache.Select(kvp => kvp.Value)
                .Where(x => (DateTime.UtcNow - x.LastEventMoment).TotalSeconds > timeFrameInSeconds)
                .Any();
            if (isAnyWatcherStale)
            {
                return Task.FromResult(HealthCheckResult.Unhealthy("Some watchers are stale."));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error checking watchers liveness health check.");
        }
        
        return Task.FromResult(HealthCheckResult.Healthy("App is alive"));
    }
}
