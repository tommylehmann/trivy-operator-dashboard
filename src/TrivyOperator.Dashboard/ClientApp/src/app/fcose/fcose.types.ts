export interface NodeDataDto {
  bomRef?: string;
  name?: string | null;
  dependsOn?: Array<string> | null;
  groupName?: string;
}
