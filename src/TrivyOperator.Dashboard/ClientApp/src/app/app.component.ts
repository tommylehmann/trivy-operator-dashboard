import { APP_INITIALIZER, ApplicationConfig, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ApiModule } from '../api/api.module';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { initializeAppFactory, MainAppInitService } from './services/main-app-init.service';
import { routes } from './app.routes'; // Define your routes in a separate file
import { NavMenuComponent } from './nav-menu/nav-menu.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // Provide your app's routes
    provideHttpClient(), // HTTP client
    provideAnimationsAsync(), // Animations
    ApiModule.forRoot({ rootUrl: environment.baseUrl }), // API module
    MainAppInitService, // Custom service
    Title, // Title service
    MessageService, // PrimeNG message service
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [MainAppInitService],
      multi: true,
    },
  ],
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavMenuComponent], // Import NavMenuComponent
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'mama';
  constructor(private titleService: TitleService) {}
}
