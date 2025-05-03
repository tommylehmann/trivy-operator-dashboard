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

  private set darkMode(value: boolean) {
    this.isDarkMode = value;
    this.isDarkModeSubject.next(value);
    localStorage.setItem(this.locaStorageIsDarkModeKey, value.toString());

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
    this.darkMode = savedTheme ?? prefersDarkMode;
  }

  public toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }

  private watchSystemDarkMode() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
      console.log('mama ' + event.matches);
      const newIsDarkMode = event.matches;
      if (this.isDarkMode === newIsDarkMode) {
        return;
      }
      this.darkMode = newIsDarkMode;
    });
  }
}
