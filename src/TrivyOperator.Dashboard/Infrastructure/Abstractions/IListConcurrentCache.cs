namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;

public interface IListConcurrentCache<TValue> : IConcurrentCache<string, IList<TValue>>
{
}
