namespace TrivyOperator.Dashboard.Utils;

public class RetryDurationCalculator(double maxBackoffSeconds)
{
    private readonly double scaleFactor = maxBackoffSeconds;

    public TimeSpan GetNextRetryDuration(int retryAttempt) =>
        TimeSpan.FromSeconds(scaleFactor * Math.Log(retryAttempt + 1));
}
