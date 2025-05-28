import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AlertDto } from '../../api/models/alert-dto';
import { AlertsService } from '../services/alerts.service';
import { MainAppInitService } from '../services/main-app-init.service';
import { RouterEventEmitterService } from '../services/router-event-emitter.service';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenubarModule } from 'primeng/menubar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { MenuItem } from 'primeng/api';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


import {
  faClipboardList,
  faGears,
  faHouse,
  faKey,
  faServer,
  faShieldHalved,
  faUserShield,
  faDiagramProject,
  faFolderOpen,
  faDharmachakra,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { DarkModeService } from '../services/dark-mode.service';


interface TrivyMenuItem extends MenuItem {
  faIcon?: IconDefinition;
}

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
    FontAwesomeModule,
  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss'],
})
export class NavMenuComponent implements OnInit, OnDestroy {
  items: TrivyMenuItem[] = [];
  alertsCount: number = 0;
  alerts: AlertDto[] = [];
  enabledTrivyReports: string[] = ['crar', 'car', 'esr', 'vr'];
  activePage: string = "";
  isDrawerVisible = false;
  faHouse = faHouse;
  faShieldHalved = faShieldHalved;
  faClipboardList = faClipboardList;
  faUserShield = faUserShield;
  faKey = faKey;
  faGears = faGears;
  faServer = faServer;
  faDiagramProject = faDiagramProject;
  faFolderOpen = faFolderOpen;
  faDharmachakra = faDharmachakra;
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

  //get isDarkMode(): boolean {
  //  return this.mainAppInitService.isDarkMode;
  //}

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
    this.router.navigate(['/watcher-states']);
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
        faIcon: faHouse,
        command: () => {
          this.router.navigate(['/']);
          this.isDrawerVisible = false;
        },
      },
      {
        label: 'Namespaced',
        faIcon: faFolderOpen,
        expanded: true,
        items: [
          {
            label: 'Vulnerabilities',
            faIcon: this.faShieldHalved,
            disabled: !this.enabledTrivyReports.includes('vr'),
            command: () => {
              this.router.navigate(['/vulnerability-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'SBOMs',
            faIcon: faDiagramProject,
            disabled: !this.enabledTrivyReports.includes('sr'),
            command: () => {
              this.router.navigate(['/sbom-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Config Audits',
            faIcon: faClipboardList,
            disabled: !this.enabledTrivyReports.includes('car'),
            command: () => {
              this.router.navigate(['/config-audit-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Exposed Secrets',
            faIcon: faKey,
            disabled: !this.enabledTrivyReports.includes('esr'),
            command: () => {
              this.router.navigate(['/exposed-secret-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            faIcon: this.faUserShield,
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
        faIcon: faDharmachakra,
        expanded: true,
        items: [
          {
            label: 'Vulnerabilities',
            faIcon: this.faShieldHalved,
            disabled: !this.enabledTrivyReports.includes('cvr'),
            command: () => {
              this.router.navigate(['/cluster-vulnerability-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            faIcon: faUserShield,
            disabled: !this.enabledTrivyReports.includes('crar'),
            command: () => {
              this.router.navigate(['/cluster-rbac-assessment-reports']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Compliance',
            faIcon: faServer,
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
        faIcon: faFolderOpen,
        expanded: false,
        items: [
          {
            label: 'Vulnerabilities',
            faIcon: this.faShieldHalved,
            disabled: !this.enabledTrivyReports.includes('vr'),
            command: () => {
              this.router.navigate(['/vulnerability-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'SBOMs',
            faIcon: faDiagramProject,
            disabled: !this.enabledTrivyReports.includes('sr'),
            command: () => {
              this.router.navigate(['/sbom-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Config Audits',
            faIcon: faClipboardList,
            disabled: !this.enabledTrivyReports.includes('car'),
            command: () => {
              this.router.navigate(['/config-audit-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Exposed Secrets',
            faIcon: faKey,
            disabled: !this.enabledTrivyReports.includes('esr'),
            command: () => {
              this.router.navigate(['/exposed-secret-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            faIcon: this.faUserShield,
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
        faIcon: faDharmachakra,
        expanded: false,
        items: [
          {
            label: 'Vulnerabilities',
            faIcon: this.faShieldHalved,
            disabled: !this.enabledTrivyReports.includes('cvr'),
            command: () => {
              this.router.navigate(['/cluster-vulnerability-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'RBAC Assessments',
            faIcon: faUserShield,
            disabled: !this.enabledTrivyReports.includes('crar'),
            command: () => {
              this.router.navigate(['/cluster-rbac-assessment-reports-detailed']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Compliance',
            faIcon: faServer,
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
        faIcon: faGears,
        expanded: true,
        items: [
          {
            label: 'Watcher States',
            command: () => {
              this.router.navigate(['/watcher-states']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'Settings',
            command: () => {
              this.router.navigate(['/settings']);
              this.isDrawerVisible = false;
            },
          },
          {
            label: 'About',
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
