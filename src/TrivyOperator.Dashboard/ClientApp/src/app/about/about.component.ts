import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { MarkdownModule } from 'ngx-markdown';
import { provideMarkdown } from 'ngx-markdown';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';

import { AppVersionService } from '../../api/services/app-version.service';
import { GitHubRelease } from '../../api/models/git-hub-release';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MarkdownModule, CardModule, PanelModule],
  providers: [provideMarkdown()],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  releaseNotes?: GitHubRelease[];

  constructor(private service: AppVersionService) {
    this.getReleaseNotesDtos();
  }

  getReleaseNotesDtos() {
    this.service.getGitHubVersions().subscribe({
      next: (res) => this.onReleaseNoteDtos(res),
      error: (err) => console.error(err),
    });
  }

  private onReleaseNoteDtos(data: GitHubRelease[]) {
    this.releaseNotes = data;
  }
}
