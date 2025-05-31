import { Component, effect, input, model, OnInit, output } from '@angular/core';
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
  dataDtos = input.required<NamespacedImageDto[]>();
  activeNamespaces = input.required<string[] | undefined>();
  selectedImageId = model<string | undefined>(undefined);
  refreshRequested = output<void>();


  selectedNamespace?: string;

  protected imageDtos?: ImageDto[];

  get selectedImageDto(): ImageDto | undefined {
    return this._selectedImageDto;
  }
  set selectedImageDto(value: ImageDto | undefined) {
    this.selectedImageId.update(() => value?.uid);
    this._selectedImageDto = value;
  }
  private _selectedImageDto?: ImageDto;

  protected isStatic: boolean = false;

  constructor() {
    effect(() => {
      const selectedImageId = this.selectedImageId();
      if (selectedImageId) {
        console.log("namespaced image selector", selectedImageId);
        const nodeImageDto = this.dataDtos()?.find(x => x.uid === selectedImageId);
        if (nodeImageDto) {
          console.log("namespaced image selector", nodeImageDto);
          this.selectedNamespace = nodeImageDto.resourceNamespace;
          const imageDto: ImageDto = {
            uid: nodeImageDto.uid ?? "",
            imageNameTag: NamespaceImageSelectorComponent.getImageNameTag(nodeImageDto) ?? "",
            icon: nodeImageDto.icon,
          };
          this.imageDtos = [imageDto];
          this.selectedImageDto = imageDto;
        }
      }
    });
  }

  ngOnInit() {
    if (this.selectedImageId()) {
      this.isStatic = true;
    }
  }

  filterImageDtos() {
    if (this.isStatic) {
      return;
    }
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
  }

  reloadData() {
    this.selectedNamespace = undefined;
    this.imageDtos = undefined;
    this.refreshRequested.emit();
  }

  private static getImageNameTag(value: NamespacedImageDto) : string | undefined {
    if (value.imageName && value.imageTag) {
      return `${value.imageName}:${value.imageTag}`
    }
    return undefined;
  }
}
