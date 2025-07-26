import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AlertDto } from '../../../api/models/alert-dto';
import { AlertsService } from '../../services/alerts.service';
import { DarkModeService } from '../../services/dark-mode.service';
import { MainAppInitService } from '../../services/main-app-init.service';
import { RouterEventEmitterService } from '../../services/router-event-emitter.service';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
    DrawerModule,
    PanelMenuModule,
    ButtonModule,
    TagModule,
    BadgeModule,
    ToastModule,
    MatIconModule,
  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss'],
})
export class NavMenuComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  alertsCount: number = 0;
  alerts: AlertDto[] = [];
  enabledTrivyReports: string[] = ['crar', 'car', 'esr', 'vr'];
  activePage: string = "";
  isDrawerVisible = false;
  private alertSubscription!: Subscription;

  constructor(
    public router: Router,
    private alertsService: AlertsService,
    private darkModeService: DarkModeService,
    private mainAppInitService: MainAppInitService,
    private routerEventEmitterService: RouterEventEmitterService
  ) {
    this.routerEventEmitterService.title$.subscribe((title) => { this.activePage = title; });
    this.darkModeService.isDarkMode$.subscribe((isDarkMode) => { this.isDarkMode = isDarkMode; });
  }

  isDarkMode: boolean = false;

  ngOnInit() {
    this.alertSubscription = this.alertsService.alerts$.subscribe((alerts: AlertDto[]) => {
      this.onNewAlerts(alerts);
    });
    this.mainAppInitService.backendSettingsDto$.subscribe((updatedBackendSettingsDto) => {
      this.enabledTrivyReports =
        updatedBackendSettingsDto.trivyReportConfigDtos?.filter((x) => x.enabled).map((x) => x.id ?? '') ??
        this.enabledTrivyReports;
      this.setMenu();
    });
  }

  ngOnDestroy() {
    this.alertSubscription.unsubscribe();
  }

  public switchLightDarkMode() {
    this.darkModeService.toggleDarkMode();
  }

  public onAlertsClick() {
    // TODO: maybe we will debounce multiple clicks or even disable the button until the navigation is complete
    if (this.router.url === '/alerts') {
      this.alertsService.triggerRefresh();
    } else {
      this.router.navigate(['/alerts']);
    }
  }

  openDrawer() {
    this.isDrawerVisible = true;
  }

  private onNewAlerts(alerts: AlertDto[]) {
    this.alerts = alerts;

    this.alertsCount = alerts ? alerts.length : 0;
  }

  private setMenu() {
    this.items = [
      {
        label: 'Home',
        icon: 'home',
        command: () => {
          this.router.navigate(['/']);
          this.isDrawerVisible = false;
        },
      },
      {
        label: 'Namespaced',
        icon: 'dynamic_feed',
        expanded: true,
        items: [
          {
            label: 'Vulnerabilities',
            icon: 'security',
            disabled: !this.enabledTrivyReports.includes('vr'),
            command: () => {
              this.router.navigate(['/vulnerability-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'SBOMs',
            icon: 'graph_3',
            disabled: !this.enabledTrivyReports.includes('sr'),
            command: () => {
              this.router.navigate(['/sbom-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Config Audits',
            icon: 'assignment',
            disabled: !this.enabledTrivyReports.includes('car'),
            command: () => {
              this.router.navigate(['/config-audit-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Exposed Secrets',
            icon: 'key_off',
            disabled: !this.enabledTrivyReports.includes('esr'),
            command: () => {
              this.router.navigate(['/exposed-secret-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            icon: 'admin_panel_settings',
            disabled: !this.enabledTrivyReports.includes('rar'),
            command: () => {
              this.router.navigate(['/rbac-assessment-reports']);
              this.isDrawerVisible = false;
            },
          },
        ]
      },
      {
        label: 'Cluster Level',
        icon: 'storage',
        expanded: true,
        items: [
          {
            label: 'Vulnerabilities',
            icon: 'security',
            disabled: !this.enabledTrivyReports.includes('cvr'),
            command: () => {
              this.router.navigate(['/cluster-vulnerability-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            icon: 'admin_panel_settings',
            disabled: !this.enabledTrivyReports.includes('crar'),
            command: () => {
              this.router.navigate(['/cluster-rbac-assessment-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Compliance',
            icon: 'policy',
            disabled: !this.enabledTrivyReports.includes('ccr'),
            command: () => {
              this.router.navigate(['/cluster-compliance-reports']);
              this.isDrawerVisible = false;
            },
          },
        ]
      },
      {
        label: 'Namespaced - Detailed',
        icon: 'dynamic_feed',
        expanded: false,
        items: [
          {
            label: 'Vulnerabilities',
            icon: 'security',
            disabled: !this.enabledTrivyReports.includes('vr'),
            command: () => {
              this.router.navigate(['/vulnerability-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Vulnerabilities Compare',
            icon: 'security',
            disabled: !this.enabledTrivyReports.includes('vr'),
            command: () => {
              this.router.navigate(['/vulnerability-reports-compare']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'SBOMs',
            icon: 'graph_3',
            disabled: !this.enabledTrivyReports.includes('sr'),
            command: () => {
              this.router.navigate(['/sbom-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Config Audits',
            icon: 'assignment',
            disabled: !this.enabledTrivyReports.includes('car'),
            command: () => {
              this.router.navigate(['/config-audit-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Exposed Secrets',
            icon: 'key_off',
            disabled: !this.enabledTrivyReports.includes('esr'),
            command: () => {
              this.router.navigate(['/exposed-secret-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            icon: 'admin_panel_settings',
            disabled: !this.enabledTrivyReports.includes('rar'),
            command: () => {
              this.router.navigate(['/rbac-assessment-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
        ]
      },
      {
        label: 'Cluster Level - Detailed',
        icon: 'storage',
        expanded: false,
        items: [
          {
            label: 'Vulnerabilities',
            icon: 'security',
            disabled: !this.enabledTrivyReports.includes('cvr'),
            command: () => {
              this.router.navigate(['/cluster-vulnerability-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            icon: 'admin_panel_settings',
            disabled: !this.enabledTrivyReports.includes('crar'),
            command: () => {
              this.router.navigate(['/cluster-rbac-assessment-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Compliance',
            icon: 'policy',
            disabled: !this.enabledTrivyReports.includes('ccr'),
            command: () => {
              this.router.navigate(['/cluster-compliance-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
        ]
      },
      {
        label: 'System',
        icon: 'settings',
        expanded: true,
        items: [
          {
            label: 'Watcher Status',
            icon: 'mystery',
            command: () => {
              this.router.navigate(['/watcher-status']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Settings',
            icon: 'settings_applications',
            command: () => {
              this.router.navigate(['/settings']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'About',
            icon: 'chat_info',
            command: () => {
              this.router.navigate(['/about']);
              this.isDrawerVisible = false;
            },
          },
        ],
      },
    ];
  }
}
