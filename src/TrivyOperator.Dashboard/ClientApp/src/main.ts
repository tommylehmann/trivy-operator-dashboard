import { enableProdMode, StaticProvider } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { environment } from './environments/environment';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


if (environment.production) {
  enableProdMode();
}

const providers: StaticProvider[] = [];

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
