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

  public restoreMode() {
    const savedTheme = LocalStorageUtils.getBoolKeyValue(this.locaStorageIsDarkModeKey);
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setMode(savedTheme ?? prefersDarkMode);
  }

  public toggleDarkMode() {
    localStorage.setItem(this.locaStorageIsDarkModeKey, (!this.darkMode).toString());
    this.setMode(!this.darkMode);
  }

  private watchSystemDarkMode() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
      const savedTheme = LocalStorageUtils.getBoolKeyValue(this.locaStorageIsDarkModeKey);
      if (savedTheme !== null) {
        // if manual set (key exists in localstorage), exit
        return;
      }
      const newIsDarkMode = event.matches;
      if (this.isDarkMode === newIsDarkMode) {
        // ignore duplicate events
        return;
      }
      this.setMode(newIsDarkMode);
    });
  }

  private setMode(darkMode: boolean) {
    this.isDarkMode = darkMode;
    this.isDarkModeSubject.next(darkMode);
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add(DarkModeService.DARK_MODE_SELECTOR);
    }
    else {
      root.classList.remove(DarkModeService.DARK_MODE_SELECTOR);
    }
  }
}
