import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SbomReportDto } from '../../api/models/sbom-report-dto';
import { SbomReportDetailDto } from '../../api/models/sbom-report-detail-dto';
import { SbomReportImageDto } from '../../api/models/sbom-report-image-dto';
import { SbomReportService } from '../../api/services/sbom-report.service';

import { FcoseComponent } from '../fcose/fcose.component';
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyExpandTableOptions, TrivyFilterData, TrivyTableCellCustomOptions, TrivyTableColumn, TrivyTableOptions } from '../trivy-table/trivy-table.types';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';

import {
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SeverityUtils } from '../utils/severity.utils';
import { NodeDataDto } from '../fcose/fcose.types';
import { SbomDetailExtendedDto } from './sbom-reports.types'
import { SbomReportImageResourceDto } from '../../api/models';
import { HttpClient, HttpContext, HttpContextToken, HttpHeaders } from '@angular/common/http';

export interface ImageDto {
  uid: string;
  imageNameTag: string;
  digest: string;
  hasVr: boolean;
}

export interface DependsOn {
  bomRef: string;
  name: string;
  version: string;
}

@Component({
  selector: 'app-sbom-reports',
  standalone: true,
  imports: [CommonModule, FormsModule,
    FcoseComponent, TrivyTableComponent,
    ButtonModule, CardModule, DialogModule, DropdownModule, PanelModule, TableModule, TagModule, TreeTableModule,
    FontAwesomeModule],
  templateUrl: './sbom-reports.component.html',
  styleUrl: './sbom-reports.component.scss',
})
export class SbomReportsComponent {
  // #region main data - SbomReportDtos, activeNS, fullSbomDataDto, table data
  dataDtos: SbomReportImageDto[] | null = null;
  activeNamespaces: string[] | undefined = [];
  fullSbomDataDto: SbomReportDto | null = null;
  isTableLoading: boolean = false;
  // #endregion
  // #region selectedNamespace property
  get selectedNamespace(): string | null {
    return this._selectedNamespace;
  }
  set selectedNamespace(value: string | null) {
    this._selectedNamespace = value;
  }
  private _selectedNamespace: string | null = '';
  // #endregion
  // #region selectedImageDto property
  get selectedImageDto(): ImageDto | null {
    return this._imageDto;
  }
  set selectedImageDto(value: ImageDto | null) {
    this._imageDto = value;
    this.selectedImageResources = this.dataDtos?.find(x => x.uid && x.uid === value?.uid)?.resources ?? [];
    this.getFullSbomDto(value?.digest, this.selectedNamespace);
  }
  private _imageDto: ImageDto | null = null;
  // #endregion
  // #region dependsOnTable data
  selectedSbomDetailDto?: SbomDetailExtendedDto;
  dependsOnBoms?: SbomDetailExtendedDto[];
  deletedDependsOnBom: SbomDetailExtendedDto[] = [];

  dependsOnTableColumns: TrivyTableColumn[] = [];
  dependsOnTableOptions: TrivyTableOptions;
  dependsOnTableExpandTableOptions: TrivyExpandTableOptions<SbomDetailExtendedDto> = new TrivyExpandTableOptions(false, 2, 0, this.getPropertiesCount);
  // #endregion

  // #region Full Sbom Report details
  isSbomReportOverviewDialogVisible: boolean = false;
  selectedImageResources: SbomReportImageResourceDto[] = [];
  sbomReportDetailStatistics: Array<number | undefined> = [];
  sbomReportDetailPropertiesTreeNodes: TreeNode[] = [];
  sbomReportDetailLicensesTreeNodes: TreeNode[] = [];
  // #endregion

  imageDtos: ImageDto[] | undefined = []; // filtered images by ns
  hoveredSbomDetailDto: SbomReportDetailDto | undefined = undefined;
  nodeDataDtos: NodeDataDto[] = [];
  selectedSbomDetailBomRef?: string;

  private readonly _rootNodeId: string = '00000000-0000-0000-0000-000000000000';

  faShieldHalved = faShieldHalved;

  constructor(private service: SbomReportService, private http: HttpClient) {
    this.getTableDataDtos();

    this.dependsOnTableColumns = [
      {
        field: 'name',
        header: 'Name',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'white-space: nowrap; text-overflow: ellipsis; overflow: hidden; width: 290px;',
        renderType: 'standard',
      },
      {
        field: 'version',
        header: 'Version',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'standard',
      },
      {
        field: 'criticalCount',
        header: 'C',
        isFiltrable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['CRITICAL'],
      },
      {
        field: 'highCount',
        header: 'H',
        isFiltrable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px;',
        renderType: 'severityValue',
        extraFields: ['HIGH'],
      },
      {
        field: 'mediumCount',
        header: 'M',
        isFiltrable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['MEDIUM'],
      },
      {
        field: 'lowCount',
        header: 'L',
        isFiltrable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['LOW'],
      },
      {
        field: 'unknownCount',
        header: 'U',
        isFiltrable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['UNKNOWN'],
      },
      {
        field: 'level',
        header: 'Level',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'standard',
      },
    ];
    this.dependsOnTableOptions = {
      isClearSelectionVisible: false,
      isExportCsvVisible: false,
      isResetFiltersVisible: true,
      isRefreshVisible: false,
      isRefreshFiltrable: false,
      isFooterVisible: true,
      tableSelectionMode: 'single',
      tableStyle: { width: '930px' },
      stateKey: 'SBOM Reports - Depends On',
      dataKey: 'bomRef',
      rowExpansionRender: 'table',
      extraClasses: 'trivy-with-filters',
      multiHeaderAction: ["Info", "Dive In", "Export CycloneDX JSON", "Export CycloneDX XML"],
    };
  }

  // #region get data from api
  getTableDataDtos() {
    this.service.getSbomReportImageDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.service.getSbomReportActiveNamespaces().subscribe({
      next: (res) => (this.activeNamespaces = res.sort()),
      error: (err) => console.error(err),
    });
  }

  getFullSbomDto(digest: string | null | undefined, selectedNamespace: string | null) {
    if (digest && selectedNamespace) {
      this.service.getSbomReportDtoByDigestNamespace({ digest: digest, namespaceName: selectedNamespace }).subscribe({
        next: (res) => this.onGetSbomReportDtoByDigestNamespace(res),
        error: (err) => console.error(err),
      });
    }
    this.fullSbomDataDto = null;
    this.nodeDataDtos = [];
    this.sbomReportDetailLicensesTreeNodes = [];
    this.sbomReportDetailPropertiesTreeNodes = [];
    this.sbomReportDetailStatistics = [];
  }

  onGetSbomReportDtoByDigestNamespace(fullSbomDataDto: SbomReportDto) {
    this.fullSbomDataDto = fullSbomDataDto;
    this.onActiveNodeIdChange(fullSbomDataDto.rootNodeBomRef ?? "");
  }

  onGetDataDtos(dtos: SbomReportImageDto[]) {
    this.dataDtos = dtos;
  }

  reloadData() {
    this.activeNamespaces = undefined;
    this.imageDtos = undefined;
    this.selectedNamespace = null;
    this.dataDtos = null;
    this.fullSbomDataDto = null;
    this.dependsOnBoms = undefined;
    this.deletedDependsOnBom = [];
    this.nodeDataDtos = [];
    this.sbomReportDetailLicensesTreeNodes = [];
    this.sbomReportDetailPropertiesTreeNodes = [];
    this.sbomReportDetailStatistics = [];

    this.getTableDataDtos();
  }
  // #endregion

  // #region Get Parent and Children Nodes
  private getDataDtosByNodeId(nodeId: string) {
    this.isTableLoading = true;
    this.dependsOnBoms = undefined;
    this.deletedDependsOnBom = [];
    const sbomDetailDtos: SbomDetailExtendedDto[] = [];
    const rootSbomDetailDto = this.fullSbomDataDto?.details?.find((x) => x.bomRef == nodeId);
    if (rootSbomDetailDto) {
      const rootSbomExtended: SbomDetailExtendedDto = {
        ...rootSbomDetailDto,
        level: 'Base',
        group: this.getGroupFromSbomReportDetail(rootSbomDetailDto),
      }
      sbomDetailDtos.push(rootSbomExtended);
      this.getDirectParentsSbomDtos(rootSbomExtended, sbomDetailDtos);
      this.getChildrenSbomDtos(rootSbomExtended, nodeId, sbomDetailDtos);
    }

    this.dependsOnBoms = sbomDetailDtos;
    this.nodeDataDtos = sbomDetailDtos.map((x) =>
      ({
        id: x.bomRef ?? undefined,
        dependsOn: x.dependsOn,
        name: x.name,
        groupName: x.group,
        isMain: x.bomRef == nodeId,
    })) ?? [];
    this.isTableLoading = false;
  }

  private getDirectParentsSbomDtos(sded: SbomDetailExtendedDto, sdeds: SbomDetailExtendedDto[]) {
    const parents = this.fullSbomDataDto?.details?.
      filter((x) => x.dependsOn?.includes(sded.bomRef ?? ""))
      .map((y) => {
        const parentSbom: SbomDetailExtendedDto = {
          ...y,
          level: 'Ancestor',
          group: this.getGroupFromSbomReportDetail(y),
          dependsOn: [sded.bomRef ?? ""],
        }
        return parentSbom;
      }) ?? [];

    sdeds.push(...parents);
  }

  private getChildrenSbomDtos(sded: SbomDetailExtendedDto, baseBomref: string, sdeds: SbomDetailExtendedDto[]) {
    if (!sded) {
      return;
    }
    const detailIds = sded.dependsOn;
    if (!detailIds) {
      return;
    }
    const newDetailIds: string[] = [];
    detailIds.forEach((id) => {
      if (!sdeds.find((x) => x.bomRef === id)) {
        newDetailIds.push(id);
      }
    });
    const newSbomDetailDtos = this.fullSbomDataDto?.details?.
      filter((x) => newDetailIds.includes(x.bomRef ?? ''))
      .map((y) => {
        const childSbom: SbomDetailExtendedDto = {
          ...y,
          level: sded.bomRef == baseBomref ? 'Child' : 'Descendant',
          group: this.getGroupFromSbomReportDetail(y),
        }
        return childSbom;
      }) ?? [];
    sdeds.push(...newSbomDetailDtos);
    newSbomDetailDtos.forEach((sbomDetailDto) => this.getChildrenSbomDtos(sbomDetailDto, baseBomref, sdeds));
  }
  // #endregion

  filterImageDtos() {
    this.imageDtos = this.dataDtos
      ?.filter((x) => x.resourceNamespace == this.selectedNamespace)
      .map((x) => ({
        uid: x.uid ?? '', imageNameTag: `${x.imageName}:${x.imageTag}`,
        digest: x.imageDigest ?? '', hasVr: x.hasVulnerabilities ?? false
      }))
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

  // #region sanitize property name and value
  public sanitizePropertyName(value: string | null | undefined): string | null | undefined {
    return value?.replaceAll(':', ' ')
      .replaceAll('.', '-')
      .replaceAll('@', '-');
  }

  public sanitizePropertyValue(value: string | null | undefined): string | null | undefined {
    return value?.replaceAll('@', ' [@] ')
      .replaceAll('sha256:', ' [sha256:] ');
  }
  // #endregion


  severityWrapperGetCssColor(severityId: number): string {
    return SeverityUtils.getCssColor(severityId);
  }

  onHoveredNodeDtoChange(nodeId: string | undefined) {
    this.hoveredSbomDetailDto = this.getSbomDetailDtoByBomref(nodeId);
  }

  private getSbomDetailDtoByBomref(bomref: string | undefined): SbomReportDetailDto | undefined {
    return this.fullSbomDataDto?.details?.find(x => x.bomRef == bomref);
  }

  onActiveNodeIdChange(event: string) {
    const sbomDetailDto = this.fullSbomDataDto?.details?.find((x) => x.bomRef == event);
    if (sbomDetailDto) {
      this.getDataDtosByNodeId(event);
      const selectedSbomDetailDto = this.dependsOnBoms?.find(x => x.level == 'Base');
      this.selectedSbomDetailDto = selectedSbomDetailDto;
      this.selectedSbomDetailBomRef = selectedSbomDetailDto?.bomRef ?? undefined;
    }
  }

  private getGroupFromSbomReportDetail(dto: SbomReportDetailDto): string {
    if (dto.properties?.find(x => x[1] == "nuget")) {
      return `${dto.name?.split('.')[0] ?? ""} (nuget)`;
    }
    if (dto.properties?.find(x => x[1] == "dotnet-core")) {
      return `${dto.name?.split('.')[0] ?? ""} (dotnet-core)`;
    }
    if (dto.properties?.find(x => x[1] == "gobinary")) {
      return `${dto.name?.split('/')[0] ?? ""} (gobinary)`;
    }
    return "";
  }

  onTableSelectedRowChange(data: SbomDetailExtendedDto[]) {
    if (data.length == 0) {
      this.selectedSbomDetailDto = undefined;
      this.selectedSbomDetailBomRef = undefined;
    }
    else {
      this.selectedSbomDetailDto = data[0];
      this.selectedSbomDetailBomRef = data[0].bomRef ?? undefined;
    }
    console.log("sbom - onTableSelectedRowChange - length " + data.length);
  }

  onNodeIdChange(nodeId: string | undefined) {
    if (nodeId) {
      const sbomReportDetailDto = this.dependsOnBoms?.find(x => x.bomRef == nodeId);
      if (sbomReportDetailDto) {
        this.selectedSbomDetailDto = sbomReportDetailDto;
      }
    }
    else {
      this.selectedSbomDetailDto = undefined;
    }
  }

  onDeletedNodeIds(nodeIds: string[] | undefined) {
    this.deletedDependsOnBom.push(...(this.dependsOnBoms?.filter(x => nodeIds?.includes(x.bomRef ?? ""))) ?? []);
    this.dependsOnBoms = this.dependsOnBoms?.filter(x => !nodeIds?.includes(x.bomRef ?? ""));
  }

  onUndeletedNodeIds(nodeIds: string[] | undefined) {
    const undeletedSboms = this.deletedDependsOnBom.filter(x => nodeIds?.includes(x.bomRef ?? ""));
    this.deletedDependsOnBom = this.deletedDependsOnBom.filter(x => !nodeIds?.includes(x.bomRef ?? ""));
    this.dependsOnBoms = [...(this.dependsOnBoms || []), ...undeletedSboms];
  }

  // # region table expand row
  getPropertiesCount(data: SbomDetailExtendedDto): number {
    return data.properties?.length ?? 0;
  }

  dependsOnTableExpandCellOptions(
    dto: SbomDetailExtendedDto,
    type: 'header' | 'row',
    colIndex: number,
    rowIndex?: number,
  ): TrivyTableCellCustomOptions {
    rowIndex ?? 0;
    let celValue: string = '';
    let celStyle: string = '';
    let celBadge: string | undefined;
    let celButtonLink: string | undefined;
    let celUrl: string | undefined;

    switch (colIndex) {
      case 0:
        celStyle = 'width: 70px; min-width: 70px; height: 50px';
        celValue = dto.properties?.[rowIndex ?? 0]?.[0] ?? "";
        break;
      case 1:
        celStyle = 'white-space: normal; display: flex; align-items: center; height: 50px;';
        celValue = dto.properties?.[rowIndex ?? 0]?.[1] ?? "";
        break;
    }

    return {
      value: celValue,
      style: celStyle,
      badge: celBadge,
      buttonLink: celButtonLink,
      url: celUrl,
    };
  }
  // #endregion

  // #region to be moved from here
  onRowActionRequested(event: SbomDetailExtendedDto) {
    const bomRefId = event.bomRef ?? undefined;
    if (bomRefId) {
      this.onActiveNodeIdChange(bomRefId);
    }
  }

  onMultiHeaderActionRequested(event: string) {
    switch (event) {
      case "Info":
        this.onSbomReportOverviewDialogOpen();
        break;
      case "Dive In":
        const bomRefId = this.selectedSbomDetailDto?.bomRef ?? undefined;
        if (bomRefId) {
          this.onActiveNodeIdChange(bomRefId);
        }
        break;
      case "Export CycloneDX JSON":
        this.onExportCycloneDXJSON('json');
        break;
      case "Export CycloneDX XML":
        this.onExportCycloneDXJSON('xml');
        break;
      default:
        console.error("sbom - multi action call back - unknown: " + event);
    }
  }

  onSbomReportOverviewDialogOpen() {
    if (this.sbomReportDetailPropertiesTreeNodes.length == 0) {
      this.sbomReportDetailPropertiesTreeNodes = this.getSbomReportPropertyTreeNodes();
    }
    if (this.sbomReportDetailLicensesTreeNodes.length == 0) {
      this.sbomReportDetailLicensesTreeNodes = this.getSbomReportLicenseTreeNodes();
    }
    if (this.sbomReportDetailStatistics.length == 0) {
      this.sbomReportDetailStatistics.push(this.getSumForVulnerabilities(this.fullSbomDataDto?.details?.map(x => x.criticalCount) ?? []));
      this.sbomReportDetailStatistics.push(this.getSumForVulnerabilities(this.fullSbomDataDto?.details?.map(x => x.highCount) ?? []));
      this.sbomReportDetailStatistics.push(this.getSumForVulnerabilities(this.fullSbomDataDto?.details?.map(x => x.mediumCount) ?? []));
      this.sbomReportDetailStatistics.push(this.getSumForVulnerabilities(this.fullSbomDataDto?.details?.map(x => x.lowCount) ?? []));
      this.sbomReportDetailStatistics.push(this.getSumForVulnerabilities(this.fullSbomDataDto?.details?.map(x => x.unknownCount) ?? []));

      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.length ?? 0);
      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.map(item => item.dependsOn)
        .filter((deps): deps is Array<string> => Array.isArray(deps))
        .reduce((sum, deps) => sum + deps.length, 0) ?? 0);
    }

    this.isSbomReportOverviewDialogVisible = true;
  }

  onExportCycloneDXJSON(contentType: 'json' | 'xml') {
    const apiRoot = this.service.rootUrl;
    const namespaceName = encodeURIComponent(this.selectedNamespace ?? "");
    const digest = encodeURIComponent(this.selectedImageDto?.digest ?? "");
    const fileUrl = `${apiRoot}/api/sbom-reports/cyclonedx?digest=${digest}&namespaceName=${namespaceName}`;

    const headers = new HttpHeaders({
      'Accept': contentType === 'json' ? 'application/json' : 'application/xml'
    });

    this.http.get(fileUrl, { headers, responseType: 'text' }).subscribe({
      next: (response: string) => {
        const blob = new Blob([response], { type: contentType === 'json' ? 'application/json' : 'application/xml' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        link.download = `sbom_cyclonedx_${this.selectedImageDto?.imageNameTag ?? ""}.${contentType}`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(`Error fetching the file as ${contentType.toUpperCase()}:`, err);
      }
    });
  }

  /**
   * Get Properties TreeNodes
   * First, it creates a Map<> with all ProperyName and {propertyValue, usedBy} - usedBy is the SbomDetail Name
   * Then, for each one, it creates a Set<> with propertyValue and then counts children
   * the final usedByCount for each propertyName is a unique sum of all usedBy children
  */
  private getSbomReportPropertyTreeNodes(): TreeNode[] {
    const tree: TreeNode[] = [];

    const dataMap = new Map<string, { propValue: string, usedBy: string }[]>();

    this.fullSbomDataDto?.details?.forEach(item => {
      const usedBy = item.name ?? "unknown";

      item.properties?.forEach(property => {
        const propName = property[0] ?? "unknown";
        const propValue = property[1] ?? "unknown";

        if (!dataMap.has(propName)) {
          dataMap.set(propName, []);
        }

        dataMap.get(propName)!.push({ propValue, usedBy });
      });
    });

    dataMap.forEach((entries, propName) => {
      const uniqueUsedBySet = new Set<string>();

      const propNameNode: TreeNode = {
        data: { name: propName, usedByCount: 0 },
        children: []
      };

      const propValueUsedByMap = new Map<string, Set<string>>();
      entries.forEach(entry => {
        uniqueUsedBySet.add(entry.usedBy);

        if (!propValueUsedByMap.has(entry.propValue)) {
          propValueUsedByMap.set(entry.propValue, new Set<string>());
        }
        propValueUsedByMap.get(entry.propValue)!.add(entry.usedBy);
      });

      propValueUsedByMap.forEach((usedBySet, propValue) => {
        const propValueNode: TreeNode = {
          data: { name: propValue, usedByCount: usedBySet.size },
          children: []
        };

        usedBySet.forEach(usedBy => {
          propValueNode.children!.push({
            data: { name: usedBy, usedByCount: undefined },
            children: []
          });
        });

        propNameNode.children!.push(propValueNode);
      });

      propNameNode.data.usedByCount = uniqueUsedBySet.size;

      tree.push(propNameNode);
    });

    return tree;
  }

  private getSbomReportLicenseTreeNodes(): TreeNode[] {
    const licenseMap = new Map<string, Set<string>>();

    this.fullSbomDataDto?.details?.forEach(item => {
      (item.licenses || []).forEach(license => {
        if (!licenseMap.has(license)) {
          licenseMap.set(license, new Set<string>());
        }
        licenseMap.get(license)!.add(item.name ?? "unknown");
      });
    });

    const tree: TreeNode[] = [];
    licenseMap.forEach((names, license) => {
      const licenseNode: TreeNode = {
        data: { name: license, count: names.size },
        children: Array.from(names).map(name => ({
          data: { name: name, count: undefined },
          children: []
        }))
      };
      tree.push(licenseNode);
    });

    return tree;
  }

  private getSumForVulnerabilities(vulnerabilities: Array<number | undefined | null>): number | undefined {
    const usableVulnerabilities = vulnerabilities.filter((x): x is number => x != null);
    return usableVulnerabilities.length > 0
      ? usableVulnerabilities.reduce((acc, item) => acc + item, 0)
      : undefined;
  }
  // #endregion

}
