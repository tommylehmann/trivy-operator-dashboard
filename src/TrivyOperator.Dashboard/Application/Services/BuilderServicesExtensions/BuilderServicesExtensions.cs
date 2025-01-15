using k8s.Models;
using Polly;
using TrivyOperator.Dashboard.Application.Services.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Alerts;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Domain.Services;
using TrivyOperator.Dashboard.Domain.Services.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterComplianceReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterRbacAssessmentReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterSbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.ClusterVulnerabilityReport;
using TrivyOperator.Dashboard.Domain.Trivy.ConfigAuditReport;
using TrivyOperator.Dashboard.Domain.Trivy.CustomResources.Abstractions;
using TrivyOperator.Dashboard.Domain.Trivy.ExposedSecretReport;
using TrivyOperator.Dashboard.Domain.Trivy.RbacAssessmentReport;
using TrivyOperator.Dashboard.Domain.Trivy.SbomReport;
using TrivyOperator.Dashboard.Domain.Trivy.VulnerabilityReport;
using TrivyOperator.Dashboard.Infrastructure.Abstractions;
using TrivyOperator.Dashboard.Infrastructure.Clients;
using TrivyOperator.Dashboard.Infrastructure.Services;

namespace TrivyOperator.Dashboard.Application.Services.BuilderServicesExtensions;

public static class BuilderServicesExtensions
{
    public static void AddV1NamespaceServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        services.AddSingleton<IConcurrentCache<string, IList<V1Namespace>>, ConcurrentCache<string, IList<V1Namespace>>>();
        services.AddSingleton<IBackgroundQueue<V1Namespace>, BackgroundQueue<V1Namespace>>();
        if (string.IsNullOrWhiteSpace(kubernetesConfiguration.GetValue<string>("NamespaceList")))
        {
            // wtf!?
            services.AddSingleton<IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList>, NamespaceDomainService>();
            services.AddSingleton<IClusterScopedResourceWatchDomainService<V1Namespace, V1NamespaceList>, NamespaceDomainService>();
            services.AddSingleton<IClusterScopedWatcher<V1Namespace>,
                ClusterScopedWatcher<
                    V1NamespaceList,
                    V1Namespace,
                    IBackgroundQueue<V1Namespace>,
                    WatcherEvent<V1Namespace>>>();
        }
        else
        {
            services.AddSingleton<IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList>, StaticNamespaceDomainService>();
            services.AddSingleton<IClusterScopedWatcher<V1Namespace>, StaticNamespaceWatcher>();
        }

        services.AddSingleton<ICacheRefresh<V1Namespace, IBackgroundQueue<V1Namespace>>, NamespaceCacheRefresh>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler, 
            ClusterScopedCacheWatcherEventHandler<
                IBackgroundQueue<V1Namespace>,
                ICacheRefresh<V1Namespace, IBackgroundQueue<V1Namespace>>,
                WatcherEvent<V1Namespace>,
                IClusterScopedWatcher<V1Namespace>,
                V1Namespace>>();
        services.AddScoped<INamespaceService, NamespaceService>();
    }
    public static void AddClusterRbacAssessmentReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterRbacAssessmentReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterRbacAssessmentReportService, ClusterRbacAssessmentReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<ClusterRbacAssessmentReportCr>>, ConcurrentCache<string, IList<ClusterRbacAssessmentReportCr>>>();
        services.AddSingleton<IBackgroundQueue<ClusterRbacAssessmentReportCr>, BackgroundQueue<ClusterRbacAssessmentReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterRbacAssessmentReportCr>,
            ClusterScopedWatcher<
                CustomResourceList<ClusterRbacAssessmentReportCr>,
                ClusterRbacAssessmentReportCr,
                IBackgroundQueue<ClusterRbacAssessmentReportCr>,
                WatcherEvent<ClusterRbacAssessmentReportCr>>>();
        services.AddSingleton<ICacheRefresh<ClusterRbacAssessmentReportCr, IBackgroundQueue<ClusterRbacAssessmentReportCr>>,
            CacheRefresh<ClusterRbacAssessmentReportCr, IBackgroundQueue<ClusterRbacAssessmentReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler,
            ClusterScopedCacheWatcherEventHandler<
                IBackgroundQueue<ClusterRbacAssessmentReportCr>,
                ICacheRefresh<ClusterRbacAssessmentReportCr, IBackgroundQueue<ClusterRbacAssessmentReportCr>>,
                WatcherEvent<ClusterRbacAssessmentReportCr>,
                IClusterScopedWatcher<ClusterRbacAssessmentReportCr>,
                ClusterRbacAssessmentReportCr>>();
        services.AddScoped<IClusterRbacAssessmentReportService, ClusterRbacAssessmentReportService>();
    }
    public static void AddConfigAuditReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseConfigAuditReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IConfigAuditReportService, ConfigAuditReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<ConfigAuditReportCr>>, ConcurrentCache<string, IList<ConfigAuditReportCr>>>();
        services.AddSingleton<IBackgroundQueue<ConfigAuditReportCr>, BackgroundQueue<ConfigAuditReportCr>>();
        services.AddSingleton<INamespacedWatcher<ConfigAuditReportCr>, 
            NamespacedWatcher<
                CustomResourceList<ConfigAuditReportCr>,
                ConfigAuditReportCr,
                IBackgroundQueue<ConfigAuditReportCr>,
                WatcherEvent<ConfigAuditReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<ConfigAuditReportCr, IBackgroundQueue<ConfigAuditReportCr>>,
            CacheRefresh<ConfigAuditReportCr, IBackgroundQueue<ConfigAuditReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, 
            NamespacedCacheWatcherEventHandler<
                IBackgroundQueue<ConfigAuditReportCr>,
                ICacheRefresh<ConfigAuditReportCr, IBackgroundQueue<ConfigAuditReportCr>>,
                WatcherEvent<ConfigAuditReportCr>,
                INamespacedWatcher<ConfigAuditReportCr>,
                ConfigAuditReportCr>>();
        services.AddScoped<IConfigAuditReportService, ConfigAuditReportService>();
    }
    public static void AddExposedSecretReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseConfigAuditReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IExposedSecretReportService, ExposedSecretReportNullService>();
            return;
        }

        services.AddSingleton<
            IConcurrentCache<string, IList<ExposedSecretReportCr>>,
            ConcurrentCache<string, IList<ExposedSecretReportCr>>>();
        services.AddSingleton<IBackgroundQueue<ExposedSecretReportCr>, BackgroundQueue<ExposedSecretReportCr>>();
        services.AddSingleton<INamespacedWatcher<ExposedSecretReportCr>, 
            NamespacedWatcher<
                CustomResourceList<ExposedSecretReportCr>,
                ExposedSecretReportCr,
                IBackgroundQueue<ExposedSecretReportCr>,
                WatcherEvent<ExposedSecretReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<ExposedSecretReportCr, IBackgroundQueue<ExposedSecretReportCr>>,
            CacheRefresh<ExposedSecretReportCr, IBackgroundQueue<ExposedSecretReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler,
            NamespacedCacheWatcherEventHandler<
                IBackgroundQueue<ExposedSecretReportCr>,
                ICacheRefresh<ExposedSecretReportCr, IBackgroundQueue<ExposedSecretReportCr>>,
                WatcherEvent<ExposedSecretReportCr>,
                INamespacedWatcher<ExposedSecretReportCr>,
                ExposedSecretReportCr>>();
        services.AddScoped<IExposedSecretReportService, ExposedSecretReportService>();
    }
    public static void AddVulnerabilityReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseVulnerabilityReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IVulnerabilityReportService, VulnerabilityReportNullService>();
            return;
        }

        services.AddSingleton<
            IConcurrentCache<string, IList<VulnerabilityReportCr>>,
            ConcurrentCache<string, IList<VulnerabilityReportCr>>>();
        services.AddSingleton<IBackgroundQueue<VulnerabilityReportCr>, BackgroundQueue<VulnerabilityReportCr>>();
        services.AddSingleton<INamespacedWatcher<VulnerabilityReportCr>,
            NamespacedWatcher<
                CustomResourceList<VulnerabilityReportCr>,
                VulnerabilityReportCr,
                IBackgroundQueue<VulnerabilityReportCr>,
                WatcherEvent<VulnerabilityReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<VulnerabilityReportCr, IBackgroundQueue<VulnerabilityReportCr>>,
            CacheRefresh<VulnerabilityReportCr, IBackgroundQueue<VulnerabilityReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler,
            NamespacedCacheWatcherEventHandler<
                IBackgroundQueue<VulnerabilityReportCr>,
                ICacheRefresh<VulnerabilityReportCr, IBackgroundQueue<VulnerabilityReportCr>>,
                WatcherEvent<VulnerabilityReportCr>,
                INamespacedWatcher<VulnerabilityReportCr>,
                VulnerabilityReportCr>>();
        services.AddScoped<IVulnerabilityReportService, VulnerabilityReportService>();
    }
    public static void AddClusterComplianceReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterComplianceReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterComplianceReportService, ClusterComplianceReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<ClusterComplianceReportCr>>, ConcurrentCache<string, IList<ClusterComplianceReportCr>>>();
        services.AddSingleton<IBackgroundQueue<ClusterComplianceReportCr>, BackgroundQueue<ClusterComplianceReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterComplianceReportCr>,
            ClusterScopedWatcher<
                CustomResourceList<ClusterComplianceReportCr>,
                ClusterComplianceReportCr,
                IBackgroundQueue<ClusterComplianceReportCr>,
                WatcherEvent<ClusterComplianceReportCr>>>();
        services.AddSingleton<ICacheRefresh<ClusterComplianceReportCr, IBackgroundQueue<ClusterComplianceReportCr>>,
            CacheRefresh<ClusterComplianceReportCr, IBackgroundQueue<ClusterComplianceReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler,
            ClusterScopedCacheWatcherEventHandler<
                IBackgroundQueue<ClusterComplianceReportCr>,
                ICacheRefresh<ClusterComplianceReportCr, IBackgroundQueue<ClusterComplianceReportCr>>,
                WatcherEvent<ClusterComplianceReportCr>,
                IClusterScopedWatcher<ClusterComplianceReportCr>,
                ClusterComplianceReportCr>>();
        services.AddScoped<IClusterComplianceReportService, ClusterComplianceReportService>();
    }
    public static void AddClusterVulnerabilityReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterVulnerabilityReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterVulnerabilityReportService, ClusterVulnerabilityReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<ClusterVulnerabilityReportCr>>, ConcurrentCache<string, IList<ClusterVulnerabilityReportCr>>>();
        services.AddSingleton<IBackgroundQueue<ClusterVulnerabilityReportCr>, BackgroundQueue<ClusterVulnerabilityReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterVulnerabilityReportCr>,
            ClusterScopedWatcher<
                CustomResourceList<ClusterVulnerabilityReportCr>,
                ClusterVulnerabilityReportCr,
                IBackgroundQueue<ClusterVulnerabilityReportCr>,
                WatcherEvent<ClusterVulnerabilityReportCr>>>();
        services.AddSingleton<ICacheRefresh<ClusterVulnerabilityReportCr, IBackgroundQueue<ClusterVulnerabilityReportCr>>,
            CacheRefresh<ClusterVulnerabilityReportCr, IBackgroundQueue<ClusterVulnerabilityReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler,
            ClusterScopedCacheWatcherEventHandler<
                IBackgroundQueue<ClusterVulnerabilityReportCr>,
                ICacheRefresh<ClusterVulnerabilityReportCr, IBackgroundQueue<ClusterVulnerabilityReportCr>>,
                WatcherEvent<ClusterVulnerabilityReportCr>,
                IClusterScopedWatcher<ClusterVulnerabilityReportCr>,
                ClusterVulnerabilityReportCr>>();
        services.AddScoped<IClusterVulnerabilityReportService, ClusterVulnerabilityReportService>();
    }
    public static void AddRbacAssessmentReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseRbacAssessmentReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IRbacAssessmentReportService, RbacAssessmentReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<RbacAssessmentReportCr>>, ConcurrentCache<string, IList<RbacAssessmentReportCr>>>();
        services.AddSingleton<IBackgroundQueue<RbacAssessmentReportCr>, BackgroundQueue<RbacAssessmentReportCr>>();
        services.AddSingleton<INamespacedWatcher<RbacAssessmentReportCr>,
            NamespacedWatcher<
                CustomResourceList<RbacAssessmentReportCr>,
                RbacAssessmentReportCr,
                IBackgroundQueue<RbacAssessmentReportCr>,
                WatcherEvent<RbacAssessmentReportCr>>>();
        services.AddSingleton<ICacheRefresh<RbacAssessmentReportCr, IBackgroundQueue<RbacAssessmentReportCr>>,
            CacheRefresh<RbacAssessmentReportCr, IBackgroundQueue<RbacAssessmentReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler,
            NamespacedCacheWatcherEventHandler<
                IBackgroundQueue<RbacAssessmentReportCr>,
                ICacheRefresh<RbacAssessmentReportCr, IBackgroundQueue<RbacAssessmentReportCr>>,
                WatcherEvent<RbacAssessmentReportCr>,
                INamespacedWatcher<RbacAssessmentReportCr>,
                RbacAssessmentReportCr>>();
        services.AddScoped<IRbacAssessmentReportService, RbacAssessmentReportService>();
    }
    public static void AddSbomReportServices(this IServiceCollection services, IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseSbomReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<ISbomReportService, SbomReportNullService>();
            return;
        }

        services.AddSingleton<IConcurrentCache<string, IList<SbomReportCr>>, ConcurrentCache<string, IList<SbomReportCr>>>();
        services.AddSingleton<IBackgroundQueue<SbomReportCr>, BackgroundQueue<SbomReportCr>>();
        services.AddSingleton<INamespacedWatcher<SbomReportCr>, SbomReportWatcher>();
        services.AddSingleton<ICacheRefresh<SbomReportCr, IBackgroundQueue<SbomReportCr>>,
            CacheRefresh<SbomReportCr, IBackgroundQueue<SbomReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler,
            NamespacedCacheWatcherEventHandler<
                IBackgroundQueue<SbomReportCr>,
                ICacheRefresh<SbomReportCr, IBackgroundQueue<SbomReportCr>>,
                WatcherEvent<SbomReportCr>,
                INamespacedWatcher<SbomReportCr>,
                SbomReportCr>>();
        services.AddScoped<ISbomReportService, SbomReportService>();
    }
    public static void AddWatcherStateServices(this IServiceCollection services)
    {
        services.AddTransient<IWatcherState, WatcherState>();
        services.AddSingleton<IConcurrentCache<string, WatcherStateInfo>, ConcurrentCache<string, WatcherStateInfo>>();

        services.AddScoped<IWatcherStateInfoService, WatcherStateInfoService>();
    }
    public static void AddAlertsServices(this IServiceCollection services)
    {
        services.AddSignalR();
        services.AddSingleton<IConcurrentCache<string, IList<Alert>>, ConcurrentCache<string, IList<Alert>>>();
        services.AddTransient<IAlertsService, AlertsService>();
    }
    public static void AddCommons(
        this IServiceCollection services,
        IConfiguration queuesConfiguration,
        IConfiguration kubernetesConfiguration)
    {
        services.Configure<BackgroundQueueOptions>(queuesConfiguration);
        services.Configure<KubernetesOptions>(kubernetesConfiguration);

        services.AddHostedService<CacheWatcherEventHandlerHostedService>();

        services.AddSingleton<IKubernetesClientFactory, KubernetesClientFactory>();
    }
    public static void AddUiCommons(this IServiceCollection services) =>
        services.AddScoped<IBackendSettingsService, BackendSettingsService>();
    public static void AddDomainServices(this IServiceCollection services)
    {
        services.AddSingleton<ICustomResourceDefinitionFactory, CustomResourceDefinitionFactory>();

        services.AddSingleton<IClusterScopedResourceWatchDomainService<ClusterComplianceReportCr, CustomResourceList<ClusterComplianceReportCr>>, ClusterScopedTrivyReportDomainService<ClusterComplianceReportCr>>();
        services.AddSingleton<IClusterScopedResourceWatchDomainService<ClusterRbacAssessmentReportCr, CustomResourceList<ClusterRbacAssessmentReportCr>>, ClusterScopedTrivyReportDomainService<ClusterRbacAssessmentReportCr>>();
        services.AddSingleton<IClusterScopedResourceWatchDomainService<ClusterSbomReportCr, CustomResourceList<ClusterSbomReportCr>>, ClusterScopedTrivyReportDomainService<ClusterSbomReportCr>>();
        services.AddSingleton<IClusterScopedResourceWatchDomainService<ClusterVulnerabilityReportCr, CustomResourceList<ClusterVulnerabilityReportCr>>, ClusterScopedTrivyReportDomainService<ClusterVulnerabilityReportCr>>();

        services.AddSingleton<INamespacedResourceWatchDomainService<ConfigAuditReportCr, CustomResourceList<ConfigAuditReportCr>>, NamespacedTrivyReportDomainService<ConfigAuditReportCr>>();
        services.AddSingleton<INamespacedResourceWatchDomainService<ExposedSecretReportCr, CustomResourceList<ExposedSecretReportCr>>, NamespacedTrivyReportDomainService<ExposedSecretReportCr>>();
        services.AddSingleton<INamespacedResourceWatchDomainService<RbacAssessmentReportCr, CustomResourceList<RbacAssessmentReportCr>>, NamespacedTrivyReportDomainService<RbacAssessmentReportCr>>();
        services.AddSingleton<INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>>, NamespacedTrivyReportDomainService<SbomReportCr>>();
        services.AddSingleton<INamespacedResourceWatchDomainService<VulnerabilityReportCr, CustomResourceList<VulnerabilityReportCr>>, NamespacedTrivyReportDomainService<VulnerabilityReportCr>>();
    }
}
