namespace TrivyOperator.Dashboard.Application.Services.Options;

public class FileExportOptions
{
    public string TempFolder { get; init; } = Path.GetTempPath();
}
