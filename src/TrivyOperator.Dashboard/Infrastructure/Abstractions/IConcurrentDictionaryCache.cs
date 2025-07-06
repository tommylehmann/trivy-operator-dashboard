using System.Collections.Concurrent;

namespace TrivyOperator.Dashboard.Infrastructure.Abstractions;

public interface IConcurrentDictionaryCache<TValue> : IConcurrentCache<string, ConcurrentDictionary<string, TValue>>;
