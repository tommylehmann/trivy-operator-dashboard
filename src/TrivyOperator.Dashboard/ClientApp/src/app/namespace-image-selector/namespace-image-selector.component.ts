import { Component, effect, input, model, OnInit, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { NamespacedImageDto } from './namespace-image-selector.types';

interface ImageDto {
  uid: string;
  imageNameTag: string;
  icon?: string;
}

@Component({
  selector: 'app-namespace-image-selector',
  imports: [FormsModule, ButtonModule, SelectModule, TagModule, NgIf, MatIconModule],
  templateUrl: './namespace-image-selector.component.html',
  styleUrl: './namespace-image-selector.component.scss'
})
export class NamespaceImageSelectorComponent implements OnInit {
  dataDtos = input.required<NamespacedImageDto[] | undefined>();
  disabled = input<boolean>(false);
  selectedImageId = model<string | undefined>();

  selectedNamespace?: string;

  protected activeNamespaces?: string[];
  protected imageDtos?: ImageDto[];

  get selectedImageDto(): ImageDto | undefined {
    return this._selectedImageDto;
  }

  set selectedImageDto(value: ImageDto | undefined) {
    this.selectedImageId.set(value?.uid);
    this._selectedImageDto = value;
  }
  private _selectedImageDto?: ImageDto;

  constructor() {
    effect(() => {
      const currentDataDtos = this.dataDtos();
      if (currentDataDtos && currentDataDtos.length > 0) {
        this.activeNamespaces = Array
          .from(new Set(currentDataDtos.map(x => x.resourceNamespace)))
          ?.sort((x, y) => (x > y ? 1 : -1));
        // try to autoselect is selectedImageId is provided
        this.autoselectNamespace();
        // autoselect if only one row
        if (this.activeNamespaces && this.activeNamespaces.length == 1) {
          this.selectedNamespace = this.activeNamespaces[0];
          this.filterImageDtos();
          return;
        }
      } else {
        this.resetData();
      }
    });
    effect(() => {
      const imageId = this.selectedImageId();
      this.autoselectNamespace();
    });
  }

  ngOnInit() {
  }

  autoselectNamespace() {
    const imageId = this.selectedImageId();
    const selectedNamespaceName = this.dataDtos()
      ?.find(x => x.uid === imageId)
      ?.resourceNamespace;
    if (selectedNamespaceName && this.selectedNamespace !== selectedNamespaceName) {
      this.selectedNamespace = selectedNamespaceName;
      this.filterImageDtos();
      return;
    }
  }

  filterImageDtos() {
    this.imageDtos = this.dataDtos()
      ?.filter((x) => x.resourceNamespace == this.selectedNamespace)
      .map((x) => ({
        uid: x.uid ?? '', imageNameTag: NamespaceImageSelectorComponent.getImageNameTag(x) ?? "",
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
    // if cleared ns select
    if (this.imageDtos?.length == 0) {
      this.selectedImageDto = undefined;
      return;
    }
    // try to autoselect is selectedImageId is provided
    if (this.selectedImageId()) {
      const selectedImageDto = this.imageDtos
        ?.find((x) => x.uid === this.selectedImageId());
      if (selectedImageDto) {
        this.selectedImageDto = selectedImageDto;
        return;
      }
    }
    // autoselect if only one row
    if (this.imageDtos && this.imageDtos.length == 1) {
      this.selectedImageDto = this.imageDtos[0];
      return;
    }
  }

  resetData() {
    this.selectedNamespace = undefined;
    this.imageDtos = undefined;
    this.selectedImageDto = undefined;
  }

  private static getImageNameTag(value: NamespacedImageDto) : string | undefined {
    if (value.imageName && value.imageTag) {
      return `${value.imageName}:${value.imageTag}`
    }
    return undefined;
  }
}
