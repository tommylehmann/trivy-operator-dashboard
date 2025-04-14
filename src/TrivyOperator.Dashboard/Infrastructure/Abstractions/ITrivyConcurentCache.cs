namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;

public interface ITrivyConcurentCache<TValue> : IConcurrentCache<string, IList<TValue>>
{
}
