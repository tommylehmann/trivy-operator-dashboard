namespace TrivyOperator.Dashboard.Application.Services.RawDomainQueryServices;

public class CacheNotRegisteredException : Exception
{
    public CacheNotRegisteredException(string? message) : base(message)
    {
    }
}
