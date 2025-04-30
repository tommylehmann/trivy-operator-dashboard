import { enableProdMode, StaticProvider } from '@angular/core';
//import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

//import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, appConfig } from './app/app.component';


if (environment.production) {
  enableProdMode();
}

const providers: StaticProvider[] = [];
//platformBrowserDynamic(providers)
//  .bootstrapModule(AppModule)
//  .catch((err) => console.log(err));



bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
