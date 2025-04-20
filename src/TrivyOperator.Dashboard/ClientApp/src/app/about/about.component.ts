import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { MarkdownModule } from 'ngx-markdown';
import { provideMarkdown } from 'ngx-markdown';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { TagModule} from 'primeng/tag'

import { AppVersionService } from '../../api/services/app-version.service';
import { GitHubReleaseDto } from '../../api/models/git-hub-release-dto';
import { AppVersion } from '../../api/models/app-version'
import { AboutCredits } from './about.types';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MarkdownModule, CardModule, PanelModule, TagModule],
  providers: [provideMarkdown()],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  releaseNotes: GitHubReleaseDto[] = [];
  currentVersion?: AppVersion;
  latestVersion?: string;
  newVersionAvailable: boolean = false;

  credits: AboutCredits[] = [
    {
      name: 'Trivy Operator', imgSrc: 'assets/trivy-operator-logo.png', imgAlt: 'Trivy Operator Logo', imgExtraStyle: 'filter: invert(1)',
      homeUrl: 'https://trivy.dev/latest/', gitUrl: 'https://github.com/aquasecurity/trivy-operator',
      docsUrl: 'https://aquasecurity.github.io/trivy-operator/latest/'
    },
    {
      name: '.net 8', imgSrc: 'assets/net8.png', imgAlt: 'dot net 8 Logo',
      homeUrl: 'https://dotnet.microsoft.com/en-us/', gitUrl: 'https://github.com/dotnet/core',
      docsUrl: 'https://learn.microsoft.com/en-us/dotnet/'
    },
    {
      name: 'Angular', imgSrc: 'assets/angular-js.png', imgAlt: 'Angular 18 Logo',
      homeUrl: 'https://angular.dev/', gitUrl: 'https://github.com/angular/angular',
      docsUrl: 'https://angular.dev/overview'
    },
    {
      name: 'PrimeNG', imgSrc: 'assets/primeng.png', imgAlt: 'PrimeNG Logo',
      homeUrl: 'https://primeng.org/', gitUrl: 'https://github.com/primefaces/primeng',
      docsUrl: 'https://primeng.org/installation'
    },
    {
      name: 'Open Telemetry', imgSrc: 'assets/opentelemetry.png', imgAlt: 'OpenTelemetry Logo',
      homeUrl: 'https://opentelemetry.io/', gitUrl: 'https://github.com/open-telemetry',
      docsUrl: 'https://opentelemetry.io/docs/'
    }
  ];

  constructor(private service: AppVersionService) {
    this.getReleaseNotesDtos();
  }

  getReleaseNotesDtos() {
    this.service.getGitHubVersions().subscribe({
      next: (res) => this.onReleaseNoteDtos(res),
      error: (err) => console.error(err),
    });
    this.service.getCurrentVersion().subscribe({
      next: (res) => this.onCurrentVersion(res),
      error: (err) => console.error(err),
    });
  }

  private onReleaseNoteDtos(data: GitHubReleaseDto[]) {
    this.releaseNotes = data.sort((a, b) => this.parseVersion(b.tagName ?? '') - this.parseVersion(a.tagName ?? ''));
    this.latestVersion = data.find(x => x.isLatest)?.tagName?.replace('v', '');
    this.checkNewVersionAvailable();
  }

  private onCurrentVersion(data: AppVersion) {
    this.currentVersion = data;
    this.checkNewVersionAvailable();
  }

  private parseVersion(version: string): number {
    const parts = version.replace('v', '').split('.');

    const x = parseInt(parts[0], 10) || 0;
    const y = parseInt(parts[1], 10) || 0;
    const z = parseInt(parts[2], 10) || 0;

    return x * 10000 + y * 100 + z;
  }

  private checkNewVersionAvailable() {
    if (!this.currentVersion || !this.releaseNotes || !this.releaseNotes[0]) {
      return;
    }

    const parsedCurrentVersion = this.parseVersion(this.currentVersion.fileVersion ?? "0.0");
    const parsedLastVersion = this.parseVersion(this.releaseNotes[0].tagName ?? "0.0");

    this.newVersionAvailable = parsedLastVersion - parsedCurrentVersion > 0;
  }
}
