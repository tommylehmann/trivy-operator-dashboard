import { ApplicationConfig, Component } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';

import { TitleService } from './services/title.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara
      }
    })
  ]
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'mama';
  constructor(private titleService: TitleService) { }
}
