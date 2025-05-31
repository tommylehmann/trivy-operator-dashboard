import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface NamespacedImageDto {
  uid: string;
  resourceNamespace: string;
  imageName: string;
  imageTag: string;
  icon?: IconDefinition;
}
