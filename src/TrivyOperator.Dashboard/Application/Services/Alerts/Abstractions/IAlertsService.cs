using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;

public interface IAlertsService
{
    Task AddAlert(string emitter, Alert alert, CancellationToken cancellationToken);
    
    Task RemoveAlert(string emitter, Alert alert, CancellationToken cancellationToken);

    Task<IEnumerable<AlertDto>> GetAlertDtos();
}
