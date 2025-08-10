import { Component, effect, input, model, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { IconComponent } from '../icon/icon.component';
import { NamespacedImageDto } from './namespace-image-selector.types';

interface ImageDto {
  uid: string;
  group?: string;
  mainLabel: string;
  icon?: string;
}

export const nonExistingNamespace = 'N/A';

@Component({
  selector: 'app-namespace-image-selector',
  imports: [FormsModule, ButtonModule, SelectModule, TagModule, IconComponent],
  templateUrl: './namespace-image-selector.component.html',
  styleUrl: './namespace-image-selector.component.scss'
})
export class NamespaceImageSelectorComponent {
  dataDtos = input.required<NamespacedImageDto[] | undefined>();
  disabled = input<boolean>(false);
  selectedImageId = model<string | undefined>();

  namespacePlaceholder = input<string>('Select namespace');
  imagePlaceholder = input<string>('Select image');

  selectedNamespace?: string;
  nonExistingNamespace = nonExistingNamespace;

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
        uid: x.uid ?? '', mainLabel: x.mainLabel,
        group: x.group, icon: x.icon,
      } as ImageDto))
      .sort((a, b) => {
        // Normalize undefined groups
        const groupA = a.group ?? '';
        const groupB = b.group ?? '';

        if (groupA < groupB) return -1;
        if (groupA > groupB) return 1;

        // If groups are equal, sort by mainLabel
        if (a.mainLabel < b.mainLabel) return -1;
        if (a.mainLabel > b.mainLabel) return 1;

        return 0;
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
}
