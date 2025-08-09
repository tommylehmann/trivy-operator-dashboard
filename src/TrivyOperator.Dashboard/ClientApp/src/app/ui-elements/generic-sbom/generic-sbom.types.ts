export interface GenericSbomReportDto {
  details: Array<GenericSbomReportDetailDto>;
  imageName: string;
  imageRepository: string;
  imageTag: string;
  hasVulnerabilities?: boolean;
  uid: string;
  rootNodeBomRef: string;
  resourceNamespace?: string;
}

export interface GenericSbomReportDetailDto {
  bomRef: string;
  criticalCount: number;
  dependsOn: Array<string>;
  highCount: number;
  id: string;
  lowCount: number;
  matchKey: string;
  mediumCount: number;
  name: string;
  properties: Array<Array<string>>;
  purl: string;
  unknownCount: number;
  version: string;
}

export interface GenericSbomDetailExtendedDto extends GenericSbomReportDetailDto {
  level?: 'Ancestor' | 'Base' | 'Child' | 'Descendant';
  group?: string;
}
