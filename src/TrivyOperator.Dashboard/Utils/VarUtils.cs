using k8s;
using k8s.Models;
using System.Security.Cryptography;
using System.Text;
using TrivyOperator.Dashboard.Domain.Trivy;

namespace TrivyOperator.Dashboard.Utils;

public static class VarUtils
{
    public const string DefaultCacheRefreshKey = "generic.Key";

    public static string GetCacheRefreshKey(IKubernetesObject<V1ObjectMeta>? kubernetesObject) =>
        kubernetesObject?.Namespace() ?? DefaultCacheRefreshKey;

    public static List<int>? GetExcludedSeverityIdsFromStringList(string? excludedSeverities)
    {
        List<int> excludedSeverityIds = [];
        List<int> knownSeverityIds = [.. (int[])Enum.GetValues(typeof(TrivySeverity)),];

        if (string.IsNullOrWhiteSpace(excludedSeverities))
        {
            return excludedSeverityIds;
        }

        string[] excludedStringSeverities = excludedSeverities.Split(',');
        foreach (string excludedSeverity in excludedStringSeverities)
        {
            if (int.TryParse(excludedSeverity, out int vulnerabilityId))
            {
                if (!knownSeverityIds.Contains(vulnerabilityId))
                {
                    return null;
                }

                excludedSeverityIds.Add(vulnerabilityId);
            }
            else
            {
                return null;
            }
        }

        return excludedSeverityIds;
    }

    public static Guid GetDeterministicGuid(string input)
    {
        byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        byte[] guidBytes = new byte[16];
        Array.Copy(hashBytes, guidBytes, 16);
        return new Guid(guidBytes);
    }
}
