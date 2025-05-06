import { ApplicationConfig, Component, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';

import { ApiModule } from '../api/api.module';
import { environment } from '../environments/environment';

import { initializeAppFactory, MainAppInitService } from './services/main-app-init.service';
import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';

import { TitleService } from './services/title.service';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { DarkModeService } from './services/dark-mode.service';

import { trivyOperatorDashboardPreset } from './themes/trivy-operator-dashboard.preset';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule.forRoot({ rootUrl: environment.baseUrl })),
    MainAppInitService,
    Title,
    MessageService,
    provideAppInitializer(() => initializeAppFactory(inject(MainAppInitService))),
    providePrimeNG({
      theme: {
        preset: trivyOperatorDashboardPreset,
        options: {
          darkModeSelector: `.${DarkModeService.DARK_MODE_SELECTOR}`,
          cssLayer: {
            name: 'primeng',
            order: 'tailwind, primeng, app-layer',
          },
        }
      }
    }),
  ],
};


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavMenuComponent, RouterOutlet], // Import RouterOutlet here
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'mama';
  constructor(private titleService: TitleService) {}
}
