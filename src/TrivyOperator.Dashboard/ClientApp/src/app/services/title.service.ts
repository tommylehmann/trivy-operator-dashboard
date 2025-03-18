import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterEventEmitterService } from './router-event-emitter.service';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private defaultTitle: string = 'Trivy Operator Dashboard';

  constructor(
    private titleService: Title,
    private routerEventEmitterService: RouterEventEmitterService
  ) {
    this.routerEventEmitterService.title$.subscribe((title) => {
      this.updateTitle(title);
    });
  }

  private updateTitle(routeTitle: string) {
    const fullTitle = [routeTitle.replace("Reports", "Reps"), this.defaultTitle].filter(Boolean).join(' - ');
    this.titleService.setTitle(fullTitle);
  }
}
