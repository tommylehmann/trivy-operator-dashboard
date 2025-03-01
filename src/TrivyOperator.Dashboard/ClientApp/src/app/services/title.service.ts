import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private defaultTitle: string = 'Trivy Operator Dashboard';
  constructor(private titleService: Title, private router: Router) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });
  }

  private updateTitle() {
    const title = this.getTitle(this.router.routerState.snapshot.root);
    this.titleService.setTitle(title);
  }

  private getTitle(routeSnapshot: ActivatedRouteSnapshot): string {
    let title: string = ([routeSnapshot.data['title'], this.defaultTitle]).join(' - ');
    if (routeSnapshot.firstChild) {
      title = this.getTitle(routeSnapshot.firstChild) || title;
    }
    return title;
  }
}
