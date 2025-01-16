using TrivyOperator.Dashboard.Application.Models;

namespace TrivyOperator.Dashboard.Application.Services.BackendSettings.Abstractions;

public interface IBackendSettingsService
{
    Task<BackendSettingsDto> GetBackendSettings();
}
