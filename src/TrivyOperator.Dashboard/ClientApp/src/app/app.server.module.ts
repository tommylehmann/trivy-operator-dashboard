import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppComponent, appConfig } from './app.component';
import { provideServerRendering } from '@angular/platform-server';

//@NgModule({
//  imports: [ServerModule],
//  providers: [provideServerRendering(appConfig)], // Use the standalone appConfig
//  bootstrap: [AppComponent], // Bootstrap the standalone AppComponent
//})
export class AppServerModule {}
