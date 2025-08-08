export interface SbomReportBaseDto {
  details: Array<SbomReportDetailBaseDto>;
  imageName: string;
  imageRepository: string;
  imageTag: string;
  uid: string;
}

export interface SbomReportDetailBaseDto {
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
