import {Component, input, model, OnInit, output} from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

import { NamespacedImageDto } from './namespace-image-selector.types';

interface ImageDto {
  uid: string;
  imageNameTag: string;
  icon?: IconDefinition;
}

@Component({
  selector: 'app-namespace-image-selector',
  imports: [FormsModule, ButtonModule, SelectModule, TagModule, FontAwesomeModule, NgIf],
  templateUrl: './namespace-image-selector.component.html',
  styleUrl: './namespace-image-selector.component.scss'
})
export class NamespaceImageSelectorComponent implements OnInit {
  dataDtos = input<NamespacedImageDto[]>([]);
  selectedImageId = model<string | undefined>(undefined);
  refreshRequested = output<void>();

  activeNamespaces: string[] = [];
  selectedNamespace?: string;

  protected imageDtos?: ImageDto[];

  set selectedImageDto(value: ImageDto | undefined) {
    this.selectedImageId.update(() => value?.uid);
  }

  protected isStatic: boolean = false;

  ngOnInit() {
    if (this.selectedImageId()) {
      this.isStatic = true;
    }
  }

  filterImageDtos() {
    this.imageDtos = this.dataDtos()
      ?.filter((x) => x.resourceNamespace == this.selectedNamespace)
      .map((x) => ({
        uid: x.uid ?? '', imageNameTag: `${x.imageName}:${x.imageTag}`,
        icon: x.icon,
      } as ImageDto))
      .sort((a, b) => {
        if (a.imageNameTag < b.imageNameTag) {
          return -1;
        } else if (a.imageNameTag > b.imageNameTag) {
          return 1;
        } else {
          return 0;
        }
      });
  }

  reloadData() {
    this.activeNamespaces = [];
    this.selectedNamespace = undefined;
    this.imageDtos = undefined;
    this.refreshRequested.emit();
  }
}
