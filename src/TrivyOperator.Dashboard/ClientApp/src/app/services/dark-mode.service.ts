import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageUtils } from '../utils/local-storage.utils';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  static readonly DARK_MODE_SELECTOR = 'trivy-operator-dashboard-dark';
  private readonly locaStorageIsDarkModeKey = 'mainSettings.isDarkMode';

  private isDarkMode = false;
  private isDarkModeSubject = new BehaviorSubject<boolean>(this.isDarkMode);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    this.watchSystemDarkMode();
  }

  public get darkMode(): boolean {
    return this.isDarkModeSubject.getValue();
  }

  private setDarkMode(value: boolean, isUserEvent: boolean) {
    this.isDarkMode = value;
    this.isDarkModeSubject.next(value);
    if (isUserEvent) {
      localStorage.setItem(this.locaStorageIsDarkModeKey, value.toString());
    }
    else {
      const savedTheme = LocalStorageUtils.getBoolKeyValue(this.locaStorageIsDarkModeKey);
      if (savedTheme !== null) {
        return;
      }
    }

    const root = document.documentElement;
    if (value) {
      root.classList.add(DarkModeService.DARK_MODE_SELECTOR);
    } else {
      root.classList.remove(DarkModeService.DARK_MODE_SELECTOR);
    }
  }

  public restoreMode() {
    const savedTheme = LocalStorageUtils.getBoolKeyValue(this.locaStorageIsDarkModeKey);
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkMode(savedTheme ?? prefersDarkMode, false);
  }

  public toggleDarkMode() {
    this.setDarkMode(!this.darkMode, true);
  }

  private watchSystemDarkMode() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
      const newIsDarkMode = event.matches;
      if (this.isDarkMode === newIsDarkMode) {
        return;
      }
      this.setDarkMode(newIsDarkMode, false);
    });
  }
}
