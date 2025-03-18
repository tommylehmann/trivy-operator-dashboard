import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RouterEventEmitterService {
  private titleSubject = new Subject<string>();
  public title$ = this.titleSubject.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      const title = this.getTitleFromRoute(this.router.routerState.snapshot.root);
      this.titleSubject.next(title); // Emit only the title
    });
  }

  private getTitleFromRoute(routeSnapshot: ActivatedRouteSnapshot): string {
    // Extract `title` from route data
    let title = routeSnapshot.data['title'] || '';
    if (routeSnapshot.firstChild) {
      title = this.getTitleFromRoute(routeSnapshot.firstChild) || title;
    }
    return title;
  }
}
