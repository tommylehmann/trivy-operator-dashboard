using Microsoft.AspNetCore.Mvc;
using TrivyOperator.Dashboard.Application.Models;
using TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;

namespace TrivyOperator.Dashboard.Application.Controllers;

[ApiController]
[Route("api/watcher-status")]
public class WatcherStatusController(IWatcherStateInfoService watcherStateInfoService) : ControllerBase
{
    [HttpGet(Name = "GetWatcherStateInfos")]
    [ProducesResponseType<IEnumerable<WatcherStatusDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<IEnumerable<WatcherStatusDto>> GetAll() =>
        await watcherStateInfoService.GetWatcherStateInfos();

    [HttpPost("recreate")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<IResult> RecreateWatcher([FromBody] RecreateWatcherRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.KubernetesObjectType))
        {
            return Results.BadRequest(new
            {
                error = "KubernetesObjectType is required.",
                kubernetesObjectType = request?.KubernetesObjectType,
                namespaceName = request?.NamespaceName
            });
        }
        var result = await watcherStateInfoService.RecreateWatcher(request.KubernetesObjectType, request.NamespaceName);
        
        if (result.Success)
        {
            return Results.Ok(new
            {
                message = $"Watcher for '{request.KubernetesObjectType}' in namespace '{request.NamespaceName}' recreated successfully."
            });
        }

        return Results.UnprocessableEntity(new
        {
            error = result.Message,
            kubernetesObjectType = request.KubernetesObjectType,
            namespaceName = request.NamespaceName
        });
    }
}
