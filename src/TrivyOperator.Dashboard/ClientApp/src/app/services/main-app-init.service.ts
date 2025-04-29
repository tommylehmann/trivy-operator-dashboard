import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, forkJoin } from 'rxjs';

import { BackendSettingsDto } from '../../api/models/backend-settings-dto';
import { BackendSettingsService } from '../../api/services/backend-settings.service';
import { LocalStorageUtils } from '../utils/local-storage.utils';
import { SettingsService } from './settings.service';
import { AppVersion } from '../../api/models';

@Injectable({
  providedIn: 'root',
})
export class MainAppInitService {
  defaultBackendSettingsDto: BackendSettingsDto | null = null;
  private backendSettingsDtoSubject: BehaviorSubject<BackendSettingsDto> = new BehaviorSubject<BackendSettingsDto>({
    trivyReportConfigDtos: [],
  });
  backendSettingsDto$ = this.backendSettingsDtoSubject.asObservable();

  isDarkMode: boolean = false;
  private isDarkModeSubject = new BehaviorSubject<boolean>(this.isDarkMode);
  isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor(private backendSettingsService: BackendSettingsService, private settingsService: SettingsService) { }

  initializeApp(): Promise<void> {
    return new Promise((resolve, reject) => {
      forkJoin({
        backendSettings: this.backendSettingsService.getBackendSettings(),
        appVersion: this.settingsService.getAppVersion(),
      }).subscribe({
        next: ({ backendSettings, appVersion }) => {
          this.defaultBackendSettingsDto = backendSettings;
          this.mergeBackendSettingsDto(backendSettings);
          this.isDarkMode = this.getDarkMode();
          this.setDarkMode();
          this.something(appVersion);
          resolve();
        },
        error: (err) => {
          console.error('Error during app initialization:', err);
          reject(err);
        },
      });
    });
  }

  updateBackendSettingsTrivyReportConfigDto(newIds: string[]) {
    const newTrivyReportConfig = (
      this.defaultBackendSettingsDto ?? { trivyReportConfigDtos: [] }
    ).trivyReportConfigDtos?.map((dto) => {
      if (dto.enabled) {
        return { ...dto, enabled: newIds.includes(dto.id ?? '') };
      }
      return dto;
    });

    // const clone = JSON.parse(JSON.stringify(original)) as typeof original;
    this.backendSettingsDtoSubject.next({ trivyReportConfigDtos: newTrivyReportConfig });
    localStorage.setItem('backendSettings.trivyReportConfig', newIds.join(','));
    localStorage.setItem(
      'backendSettings.trivyReportConfig.defaultsPreviousSession',
      (this.defaultBackendSettingsDto?.trivyReportConfigDtos?.filter((x) => x.enabled).map((x) => x.id) ?? []).join(
        ',',
      ),
    );
  }

  switchLightDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.setDarkMode();
  }

  private getDarkMode(): boolean {
    return (
      LocalStorageUtils.getBoolKeyValue('mainSettings.isDarkMode') ??
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }

  private setDarkMode() {
    //const primengThemeLink = document.getElementById('primeng-theme') as HTMLLinkElement | null;
    //if (primengThemeLink == null) {
    //  return;
    //}
    //primengThemeLink.href = this.isDarkMode ? 'primeng-dark.css' : 'primeng-light.css';
    localStorage.setItem('mainSettings.isDarkMode', this.isDarkMode.toString());
    this.isDarkModeSubject.next(this.isDarkMode);
  }

  private mergeBackendSettingsDto(backendSettingsDto: BackendSettingsDto) {
    const previousItems: string[] =
      localStorage.getItem('backendSettings.trivyReportConfig.defaultsPreviousSession')?.split(',') ?? [];
    const itemsToAdd = (
      backendSettingsDto.trivyReportConfigDtos?.filter((x) => x.enabled)?.map((x) => x.id ?? '') ?? []
    ).filter((x) => !previousItems.includes(x));
    const savedItems: string[] =
      localStorage.getItem('backendSettings.trivyReportConfig')?.split(',') ??
      backendSettingsDto.trivyReportConfigDtos?.filter((x) => x.enabled).map((x) => x.id ?? '') ??
      [];
    const mergedItems = [...savedItems, ...itemsToAdd.filter((item) => !savedItems.includes(item))];
    this.updateBackendSettingsTrivyReportConfigDto(mergedItems);
  }

  private something(appVersion: AppVersion) {
    const appVersionKeyName = 'settings.appVersion';
    const savedAppVersion = localStorage.getItem(appVersionKeyName);
    if (!savedAppVersion) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trivyTable')) {
          keys.push(key);
        }
      }
      keys.forEach(x => localStorage.removeItem(x));
    }
    localStorage.setItem(appVersionKeyName, appVersion.fileVersion ?? "1.0");
  }
}

export function initializeAppFactory(service: MainAppInitService) {
  return () => service.initializeApp();
}
