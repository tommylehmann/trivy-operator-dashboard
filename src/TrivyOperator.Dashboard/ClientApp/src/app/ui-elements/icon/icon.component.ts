import { Component, effect, inject, input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-icon',
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss'
})
export class IconComponent implements  OnInit {
  name = input.required<string>();
  class = input<string>('');    // optional Tailwind classes
  svgContent: SafeHtml = '';

  private httpClientService = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    effect(() => {
      console.log("name:", this.name());
      console.log("class:", this.class());
    });
  }

  ngOnInit() {
    const path = `assets/icons/${this.name()}.svg`;
    this.httpClientService.get(path, { responseType: 'text' }).subscribe({
      next: svg => {
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
      },
      error: err => {
        console.error(`Failed to load icon: ${this.name()}`, err);
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml('<svg><!-- fallback --></svg>');
      }
    });
  }
}
