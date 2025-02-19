using Microsoft.Extensions.Options;
using System.Threading.Channels;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;

namespace TrivyOperator.Dashboard.Application.Services.BackgroundQueues;

public class BackgroundQueue<TObject> : IBackgroundQueue<TObject> where TObject : class
{
    private readonly ILogger<BackgroundQueue<TObject>> logger;
    private readonly Channel<TObject> queue;

    public BackgroundQueue(IOptions<BackgroundQueueOptions> options, ILogger<BackgroundQueue<TObject>> logger)
    {
        this.logger = logger;
        BoundedChannelOptions boundedChannelOptions = new(options.Value.Capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
        };
        queue = Channel.CreateBounded<TObject>(boundedChannelOptions);
        logger.LogDebug("Started BackgroundQueue for {objectType}.", typeof(TObject).Name);
    }

    public async ValueTask QueueBackgroundWorkItemAsync(TObject enqueuedObject)
    {
        ArgumentNullException.ThrowIfNull(enqueuedObject, nameof(enqueuedObject));

        logger.LogDebug(
            "Queueing {objectType}",
            typeof(TObject).Name);
        await queue.Writer.WriteAsync(enqueuedObject);
    }

    public async ValueTask<TObject> DequeueAsync(CancellationToken cancellationToken)
    {
        TObject enqueuedObject = await queue.Reader.ReadAsync(cancellationToken);
        logger.LogDebug(
            "Dequeued {objectType}",
            typeof(TObject).Name);

        return enqueuedObject;
    }
}
