using k8s.Models;
using TrivyOperator.Dashboard.Application.Services.Alerts;
using TrivyOperator.Dashboard.Application.Services.Alerts.Abstractions;
using TrivyOperator.Dashboard.Application.Services.BackendSettings;
using TrivyOperator.Dashboard.Application.Services.BackendSettings.Abstractions;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues;
using TrivyOperator.Dashboard.Application.Services.BackgroundQueues.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh;
using TrivyOperator.Dashboard.Application.Services.CacheRefresh.Abstractions;
using TrivyOperator.Dashboard.Application.Services.CacheWatcherEventHandlers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Namespaces;
using TrivyOperator.Dashboard.Application.Services.Namespaces.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Options;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterComplianceReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterRbacAssessmentReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterRbacAssessmentReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterVulnerabilityReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.ClusterVulnerabilityReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.ConfigAuditReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.ConfigAuditReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.ExposedSecretReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.ExposedSecretReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.RbacAssessmentReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.RbacAssessmentReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.SbomReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Trivy.VulnerabilityReport;
using TrivyOperator.Dashboard.Application.Services.Trivy.VulnerabilityReport.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherEvents.Abstractions;
using TrivyOperator.Dashboard.Application.Services.Watchers;
using TrivyOperator.Dashboard.Application.Services.Watchers.Abstractions;
using TrivyOperator.Dashboard.Application.Services.WatcherStates;
using TrivyOperator.Dashboard.Application.Services.WatcherStates.Abstractions;
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
        services
            .AddSingleton<IConcurrentCache<string, IList<V1Namespace>>, ConcurrentCache<string, IList<V1Namespace>>>();
        services.AddSingleton<IKubernetesBackgroundQueue<V1Namespace>, KubernetesBackgroundQueue<V1Namespace>>();
        if (string.IsNullOrWhiteSpace(kubernetesConfiguration.GetValue<string>("NamespaceList")))
        {
            // wtf!?
            services
                .AddSingleton<IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList>,
                    NamespaceDomainService>();
            services
                .AddSingleton<IClusterScopedResourceWatchDomainService<V1Namespace, V1NamespaceList>,
                    NamespaceDomainService>();
            services.AddSingleton<IClusterScopedWatcher<V1Namespace>,
                ClusterScopedWatcher<V1NamespaceList, V1Namespace, IKubernetesBackgroundQueue<V1Namespace>,
                    WatcherEvent<V1Namespace>>>();
        }
        else
        {
            services
                .AddSingleton<IClusterScopedResourceQueryDomainService<V1Namespace, V1NamespaceList>,
                    StaticNamespaceDomainService>();
            services.AddSingleton<IClusterScopedWatcher<V1Namespace>, StaticNamespaceWatcher>();
        }

        services.AddSingleton<ICacheRefresh<V1Namespace, IKubernetesBackgroundQueue<V1Namespace>>, NamespaceCacheRefresh>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler, ClusterScopedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<V1Namespace>, ICacheRefresh<V1Namespace, IKubernetesBackgroundQueue<V1Namespace>>,
            WatcherEvent<V1Namespace>, IClusterScopedWatcher<V1Namespace>, V1Namespace>>();
        services.AddScoped<INamespaceService, NamespaceService>();
    }

    public static void AddClusterRbacAssessmentReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterRbacAssessmentReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterRbacAssessmentReportService, ClusterRbacAssessmentReportNullService>();
            return;
        }

        services
            .AddSingleton<IConcurrentCache<string, IList<ClusterRbacAssessmentReportCr>>,
                ConcurrentCache<string, IList<ClusterRbacAssessmentReportCr>>>();
        services
            .AddSingleton<IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>,
                KubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterRbacAssessmentReportCr>, ClusterScopedWatcher<
            CustomResourceList<ClusterRbacAssessmentReportCr>, ClusterRbacAssessmentReportCr,
            IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>, WatcherEvent<ClusterRbacAssessmentReportCr>>>();
        services
            .AddSingleton<ICacheRefresh<ClusterRbacAssessmentReportCr, IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>>,
                CacheRefresh<ClusterRbacAssessmentReportCr, IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler, ClusterScopedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>,
            ICacheRefresh<ClusterRbacAssessmentReportCr, IKubernetesBackgroundQueue<ClusterRbacAssessmentReportCr>>,
            WatcherEvent<ClusterRbacAssessmentReportCr>, IClusterScopedWatcher<ClusterRbacAssessmentReportCr>,
            ClusterRbacAssessmentReportCr>>();
        services.AddScoped<IClusterRbacAssessmentReportService, ClusterRbacAssessmentReportService>();
    }

    public static void AddConfigAuditReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseConfigAuditReport");
        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IConfigAuditReportService, ConfigAuditReportNullService>();
            return;
        }

        services
            .AddSingleton<IConcurrentCache<string, IList<ConfigAuditReportCr>>,
                ConcurrentCache<string, IList<ConfigAuditReportCr>>>();
        services.AddSingleton<IKubernetesBackgroundQueue<ConfigAuditReportCr>, KubernetesBackgroundQueue<ConfigAuditReportCr>>();
        services.AddSingleton<INamespacedWatcher<ConfigAuditReportCr>,
            NamespacedWatcher<CustomResourceList<ConfigAuditReportCr>, ConfigAuditReportCr,
                IKubernetesBackgroundQueue<ConfigAuditReportCr>, WatcherEvent<ConfigAuditReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<ConfigAuditReportCr, IKubernetesBackgroundQueue<ConfigAuditReportCr>>,
            CacheRefresh<ConfigAuditReportCr, IKubernetesBackgroundQueue<ConfigAuditReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, NamespacedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<ConfigAuditReportCr>,
            ICacheRefresh<ConfigAuditReportCr, IKubernetesBackgroundQueue<ConfigAuditReportCr>>, WatcherEvent<ConfigAuditReportCr>
            , INamespacedWatcher<ConfigAuditReportCr>, ConfigAuditReportCr>>();
        services.AddScoped<IConfigAuditReportService, ConfigAuditReportService>();
    }

    public static void AddExposedSecretReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
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
        services.AddSingleton<IKubernetesBackgroundQueue<ExposedSecretReportCr>, KubernetesBackgroundQueue<ExposedSecretReportCr>>();
        services.AddSingleton<INamespacedWatcher<ExposedSecretReportCr>,
            NamespacedWatcher<CustomResourceList<ExposedSecretReportCr>, ExposedSecretReportCr,
                IKubernetesBackgroundQueue<ExposedSecretReportCr>, WatcherEvent<ExposedSecretReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<ExposedSecretReportCr, IKubernetesBackgroundQueue<ExposedSecretReportCr>>,
            CacheRefresh<ExposedSecretReportCr, IKubernetesBackgroundQueue<ExposedSecretReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, NamespacedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<ExposedSecretReportCr>,
            ICacheRefresh<ExposedSecretReportCr, IKubernetesBackgroundQueue<ExposedSecretReportCr>>,
            WatcherEvent<ExposedSecretReportCr>, INamespacedWatcher<ExposedSecretReportCr>, ExposedSecretReportCr>>();
        services.AddScoped<IExposedSecretReportService, ExposedSecretReportService>();
    }

    public static void AddVulnerabilityReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
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
        services.AddSingleton<IKubernetesBackgroundQueue<VulnerabilityReportCr>, KubernetesBackgroundQueue<VulnerabilityReportCr>>();
        services.AddSingleton<INamespacedWatcher<VulnerabilityReportCr>,
            NamespacedWatcher<CustomResourceList<VulnerabilityReportCr>, VulnerabilityReportCr,
                IKubernetesBackgroundQueue<VulnerabilityReportCr>, WatcherEvent<VulnerabilityReportCr>>>();
        services.AddSingleton<
            ICacheRefresh<VulnerabilityReportCr, IKubernetesBackgroundQueue<VulnerabilityReportCr>>,
            CacheRefresh<VulnerabilityReportCr, IKubernetesBackgroundQueue<VulnerabilityReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, NamespacedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<VulnerabilityReportCr>,
            ICacheRefresh<VulnerabilityReportCr, IKubernetesBackgroundQueue<VulnerabilityReportCr>>,
            WatcherEvent<VulnerabilityReportCr>, INamespacedWatcher<VulnerabilityReportCr>, VulnerabilityReportCr>>();
        services.AddScoped<IVulnerabilityReportService, VulnerabilityReportService>();
    }

    public static void AddClusterComplianceReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterComplianceReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterComplianceReportService, ClusterComplianceReportNullService>();
            return;
        }

        services
            .AddSingleton<IConcurrentCache<string, IList<ClusterComplianceReportCr>>,
                ConcurrentCache<string, IList<ClusterComplianceReportCr>>>();
        services
            .AddSingleton<IKubernetesBackgroundQueue<ClusterComplianceReportCr>, KubernetesBackgroundQueue<ClusterComplianceReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterComplianceReportCr>, ClusterScopedWatcher<
            CustomResourceList<ClusterComplianceReportCr>, ClusterComplianceReportCr,
            IKubernetesBackgroundQueue<ClusterComplianceReportCr>, WatcherEvent<ClusterComplianceReportCr>>>();
        services.AddSingleton<ICacheRefresh<ClusterComplianceReportCr, IKubernetesBackgroundQueue<ClusterComplianceReportCr>>,
            CacheRefresh<ClusterComplianceReportCr, IKubernetesBackgroundQueue<ClusterComplianceReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler, ClusterScopedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<ClusterComplianceReportCr>,
            ICacheRefresh<ClusterComplianceReportCr, IKubernetesBackgroundQueue<ClusterComplianceReportCr>>,
            WatcherEvent<ClusterComplianceReportCr>, IClusterScopedWatcher<ClusterComplianceReportCr>,
            ClusterComplianceReportCr>>();
        services.AddScoped<IClusterComplianceReportService, ClusterComplianceReportService>();
    }

    public static void AddClusterVulnerabilityReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseClusterVulnerabilityReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IClusterVulnerabilityReportService, ClusterVulnerabilityReportNullService>();
            return;
        }

        services
            .AddSingleton<IConcurrentCache<string, IList<ClusterVulnerabilityReportCr>>,
                ConcurrentCache<string, IList<ClusterVulnerabilityReportCr>>>();
        services
            .AddSingleton<IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>,
                KubernetesBackgroundQueue<ClusterVulnerabilityReportCr>>();
        services.AddSingleton<IClusterScopedWatcher<ClusterVulnerabilityReportCr>, ClusterScopedWatcher<
            CustomResourceList<ClusterVulnerabilityReportCr>, ClusterVulnerabilityReportCr,
            IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>, WatcherEvent<ClusterVulnerabilityReportCr>>>();
        services
            .AddSingleton<ICacheRefresh<ClusterVulnerabilityReportCr, IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>>,
                CacheRefresh<ClusterVulnerabilityReportCr, IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>>>();
        services.AddSingleton<IClusterScopedCacheWatcherEventHandler, ClusterScopedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>,
            ICacheRefresh<ClusterVulnerabilityReportCr, IKubernetesBackgroundQueue<ClusterVulnerabilityReportCr>>,
            WatcherEvent<ClusterVulnerabilityReportCr>, IClusterScopedWatcher<ClusterVulnerabilityReportCr>,
            ClusterVulnerabilityReportCr>>();
        services.AddScoped<IClusterVulnerabilityReportService, ClusterVulnerabilityReportService>();
    }

    public static void AddRbacAssessmentReportServices(
        this IServiceCollection services,
        IConfiguration kubernetesConfiguration)
    {
        bool? useServices = kubernetesConfiguration.GetValue<bool?>("TrivyUseRbacAssessmentReport");

        if (useServices == null || !(bool)useServices)
        {
            services.AddScoped<IRbacAssessmentReportService, RbacAssessmentReportNullService>();
            return;
        }

        services
            .AddSingleton<IConcurrentCache<string, IList<RbacAssessmentReportCr>>,
                ConcurrentCache<string, IList<RbacAssessmentReportCr>>>();
        services.AddSingleton<IKubernetesBackgroundQueue<RbacAssessmentReportCr>, KubernetesBackgroundQueue<RbacAssessmentReportCr>>();
        services.AddSingleton<INamespacedWatcher<RbacAssessmentReportCr>,
            NamespacedWatcher<CustomResourceList<RbacAssessmentReportCr>, RbacAssessmentReportCr,
                IKubernetesBackgroundQueue<RbacAssessmentReportCr>, WatcherEvent<RbacAssessmentReportCr>>>();
        services.AddSingleton<ICacheRefresh<RbacAssessmentReportCr, IKubernetesBackgroundQueue<RbacAssessmentReportCr>>,
            CacheRefresh<RbacAssessmentReportCr, IKubernetesBackgroundQueue<RbacAssessmentReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, NamespacedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<RbacAssessmentReportCr>,
            ICacheRefresh<RbacAssessmentReportCr, IKubernetesBackgroundQueue<RbacAssessmentReportCr>>,
            WatcherEvent<RbacAssessmentReportCr>, INamespacedWatcher<RbacAssessmentReportCr>,
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

        services
            .AddSingleton<IConcurrentCache<string, IList<SbomReportCr>>,
                ConcurrentCache<string, IList<SbomReportCr>>>();
        services.AddSingleton<IKubernetesBackgroundQueue<SbomReportCr>, KubernetesBackgroundQueue<SbomReportCr>>();
        services.AddSingleton<INamespacedWatcher<SbomReportCr>, SbomReportWatcher>();
        services.AddSingleton<ICacheRefresh<SbomReportCr, IKubernetesBackgroundQueue<SbomReportCr>>,
            CacheRefresh<SbomReportCr, IKubernetesBackgroundQueue<SbomReportCr>>>();
        services.AddSingleton<INamespacedCacheWatcherEventHandler, NamespacedCacheWatcherEventHandler<
            IKubernetesBackgroundQueue<SbomReportCr>, ICacheRefresh<SbomReportCr, IKubernetesBackgroundQueue<SbomReportCr>>,
            WatcherEvent<SbomReportCr>, INamespacedWatcher<SbomReportCr>, SbomReportCr>>();
        services.AddScoped<ISbomReportService, SbomReportService>();
    }

    public static void AddWatcherStateServices(this IServiceCollection services)
    {
        
        services.AddSingleton<IConcurrentCache<string, WatcherStateInfo>, ConcurrentCache<string, WatcherStateInfo>>();
        services.AddSingleton<IBackgroundQueue<WatcherStateInfo>, BackgroundQueue<WatcherStateInfo>>();
        services.AddSingleton<IWatcherState, WatcherState>();
        services.AddScoped<IWatcherStateInfoService, WatcherStateInfoService>();

        // old
        services.AddTransient<IWatcherStateOld, WatcherStateOld>();
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
        IConfiguration kubernetesConfiguration,
        IConfiguration watchersConfiguration)
    {
        services.Configure<BackgroundQueueOptions>(queuesConfiguration);
        services.Configure<KubernetesOptions>(kubernetesConfiguration);
        services.Configure<WatchersOptions>(watchersConfiguration);

        services.AddHostedService<CacheWatcherEventHandlerHostedService>();
        services.AddHostedService<WatcherStateCacheTimedHostedService>();

        services.AddSingleton<IKubernetesClientFactory, KubernetesClientFactory>();
    }

    public static void AddUiCommons(this IServiceCollection services) =>
        services.AddScoped<IBackendSettingsService, BackendSettingsService>();

    public static void AddDomainServices(this IServiceCollection services)
    {
        services.AddSingleton<ICustomResourceDefinitionFactory, CustomResourceDefinitionFactory>();

        services
            .AddSingleton<
                IClusterScopedResourceWatchDomainService<ClusterComplianceReportCr,
                    CustomResourceList<ClusterComplianceReportCr>>,
                ClusterScopedTrivyReportDomainService<ClusterComplianceReportCr>>();
        services
            .AddSingleton<
                IClusterScopedResourceWatchDomainService<ClusterRbacAssessmentReportCr,
                    CustomResourceList<ClusterRbacAssessmentReportCr>>,
                ClusterScopedTrivyReportDomainService<ClusterRbacAssessmentReportCr>>();
        services
            .AddSingleton<
                IClusterScopedResourceWatchDomainService<ClusterSbomReportCr, CustomResourceList<ClusterSbomReportCr>>,
                ClusterScopedTrivyReportDomainService<ClusterSbomReportCr>>();
        services
            .AddSingleton<
                IClusterScopedResourceWatchDomainService<ClusterVulnerabilityReportCr,
                    CustomResourceList<ClusterVulnerabilityReportCr>>,
                ClusterScopedTrivyReportDomainService<ClusterVulnerabilityReportCr>>();

        services
            .AddSingleton<
                INamespacedResourceWatchDomainService<ConfigAuditReportCr, CustomResourceList<ConfigAuditReportCr>>,
                NamespacedTrivyReportDomainService<ConfigAuditReportCr>>();
        services
            .AddSingleton<
                INamespacedResourceWatchDomainService<ExposedSecretReportCr, CustomResourceList<ExposedSecretReportCr>>,
                NamespacedTrivyReportDomainService<ExposedSecretReportCr>>();
        services
            .AddSingleton<
                INamespacedResourceWatchDomainService<RbacAssessmentReportCr,
                    CustomResourceList<RbacAssessmentReportCr>>,
                NamespacedTrivyReportDomainService<RbacAssessmentReportCr>>();
        services
            .AddSingleton<INamespacedResourceWatchDomainService<SbomReportCr, CustomResourceList<SbomReportCr>>,
                NamespacedTrivyReportDomainService<SbomReportCr>>();
        services
            .AddSingleton<
                INamespacedResourceWatchDomainService<VulnerabilityReportCr, CustomResourceList<VulnerabilityReportCr>>,
                NamespacedTrivyReportDomainService<VulnerabilityReportCr>>();
    }
}
