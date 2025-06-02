import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SbomReportDto } from '../../api/models/sbom-report-dto';
import { SbomReportDetailDto } from '../../api/models/sbom-report-detail-dto';
import { SbomReportImageDto } from '../../api/models/sbom-report-image-dto';
import { SbomReportService } from '../../api/services/sbom-report.service';
import { NodeDataDto } from '../fcose/fcose.types';
import { SbomDetailExtendedDto } from './sbom-reports.types'

import { SeverityCssStyleByIdPipe } from '../pipes/severity-css-style-by-id.pipe';
import { SeverityNameByIdPipe } from '../pipes/severity-name-by-id.pipe';
import { VulnerabilityCountPipe } from '../pipes/vulnerability-count.pipe';

import { FcoseComponent } from '../fcose/fcose.component';
import { NamespaceImageSelectorComponent } from '../namespace-image-selector/namespace-image-selector.component';
import { NamespacedImageDto } from '../namespace-image-selector/namespace-image-selector.types';
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyExpandTableOptions, TrivyTableCellCustomOptions, TrivyTableColumn, TrivyTableOptions } from '../trivy-table/trivy-table.types';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SplitterModule } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';

import {
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GetSbomReportImageDtos$Params } from '../../api/fn/sbom-report/get-sbom-report-image-dtos';

@Component({
  selector: 'app-sbom-reports',
  standalone: true,
  imports: [CommonModule, FormsModule,
    FcoseComponent, NamespaceImageSelectorComponent, TrivyTableComponent,
    SeverityCssStyleByIdPipe, SeverityNameByIdPipe, VulnerabilityCountPipe,
    ButtonModule, CardModule, DialogModule, PanelModule, SelectModule, SplitterModule, TableModule, TagModule, TreeTableModule,
    FontAwesomeModule,],
  templateUrl: './sbom-reports.component.html',
  styleUrl: './sbom-reports.component.scss',
})
export class SbomReportsComponent implements OnInit {
  // region main data - SbomReportDtos, activeNS, fullSbomDataDto, table data
  dataDtos?: SbomReportImageDto[];
  fullSbomDataDto?: SbomReportDto;
  isTableLoading: boolean = false;
  // endregion

  // region namespaced image selector component
  namespacedImageDtos?: NamespacedImageDto[];
  protected selectedSbomReportImageDto?: SbomReportImageDto;

  set selectedImageId(value: string | undefined) {
    this.selectedSbomReportImageDto = this.dataDtos?.find(x => x.uid && x.uid === value);
    if (this.selectedSbomReportImageDto) {
      this.resetAllRelatedData();
      this.getFullSbomDto(
        this.selectedSbomReportImageDto.imageDigest ?? undefined,
        this.selectedSbomReportImageDto.resourceNamespace ?? undefined);
    }
  }
  // endregion
  // region dependsOnTable data
  selectedSbomDetailDto?: SbomDetailExtendedDto;
  dependsOnBoms?: SbomDetailExtendedDto[];
  deletedDependsOnBom: SbomDetailExtendedDto[] = [];

  dependsOnTableColumns: TrivyTableColumn[] = [
    {
      field: 'name',
      header: 'Name',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'white-space: nowrap; text-overflow: ellipsis; overflow: hidden; width: 290px;',
      renderType: 'standard',
    },
    {
      field: 'version',
      header: 'Version',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 130px; max-width: 130px;',
      renderType: 'standard',
    },
    {
      field: 'criticalCount',
      header: 'C',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 50px; max-width: 50px;',
      renderType: 'severityValue',
      extraFields: ['0'],
    },
    {
      field: 'highCount',
      header: 'H',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 50px;',
      renderType: 'severityValue',
      extraFields: ['1'],
    },
    {
      field: 'mediumCount',
      header: 'M',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 50px; max-width: 50px;',
      renderType: 'severityValue',
      extraFields: ['2'],
    },
    {
      field: 'lowCount',
      header: 'L',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 50px; max-width: 50px;',
      renderType: 'severityValue',
      extraFields: ['3'],
    },
    {
      field: 'unknownCount',
      header: 'U',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 50px; max-width: 50px;',
      renderType: 'severityValue',
      extraFields: ['4'],
    },
    {
      field: 'level',
      header: 'Level',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 130px; max-width: 130px;',
      renderType: 'standard',
    },
  ];
  dependsOnTableOptions: TrivyTableOptions = {
    isClearSelectionVisible: false,
    isExportCsvVisible: false,
    isResetFiltersVisible: false,
    isRefreshVisible: true,
    isRefreshFilterable: false,
    isFooterVisible: false,
    tableSelectionMode: 'single',
    tableStyle: { width: '930px' },
    stateKey: 'SBOM Reports - Depends On',
    dataKey: 'bomRef',
    rowExpansionRender: 'table',
    extraClasses: 'trivy-with-filters',
    multiHeaderActions: [
      { label: "", icon: 'pi pi-align-justify', specialAction: "Go to Detailed \u29C9" },
      { label: "Info",  icon: 'pi pi-info-circle', enabledIfDataLoaded: true, },
      { label: "Dive In", icon: 'pi pi-arrow-down-right', enabledIfRowSelected: true, },
      { label: "Export CycloneDX JSON", icon: 'pi pi-file-export', enabledIfDataLoaded: true, },
      { label: "Export CycloneDX XML" , icon: 'pi pi-file-export', enabledIfDataLoaded: true, },
      { label: "Go to Vulnerability Report \u29C9", icon: 'pi pi-shield', enabledIfDataLoaded: true, },
      { label: "", specialAction: "Clear Selection", },
      { label: "", specialAction: "Clear Sort/Filters", },
      { label: "", specialAction: "Collapse All", },
    ],
  };
  dependsOnTableExpandTableOptions: TrivyExpandTableOptions<SbomDetailExtendedDto> = new TrivyExpandTableOptions(false, 2, 0, this.getPropertiesCount);
  // endregion

  // region Full Sbom Report details
  isSbomReportOverviewDialogVisible: boolean = false;
  sbomReportDetailStatistics: Array<number | undefined> = [];
  sbomReportDetailPropertiesTreeNodes: TreeNode[] = [];
  sbomReportDetailLicensesTreeNodes: TreeNode[] = [];
  // endregion

  hoveredSbomDetailDto: SbomReportDetailDto | undefined = undefined;
  nodeDataDtos: NodeDataDto[] = [];
  selectedSbomDetailBomRef?: string;

  private readonly _rootNodeId: string = '00000000-0000-0000-0000-000000000000';

  faShieldHalved = faShieldHalved;

  queryNamespaceName?: string;
  queryDigest?: string;
  isStatic: boolean = false;

  screenSize: string = this.getScreenSize();

  constructor(private service: SbomReportService, private http: HttpClient, private router: Router, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryNamespaceName = params.get('namespaceName') ?? undefined;
      this.queryDigest = params.get('digest') ?? undefined;
    });
  }

  ngOnInit() {
    this.isStatic = !!(this.queryNamespaceName && this.queryDigest);

    this.getTableDataDtos();
  }

  // #region get data from api
  getTableDataDtos() {
    const params = this.isStatic
      ? { digest: this.queryDigest, namespaceName: this.queryNamespaceName } as GetSbomReportImageDtos$Params
      : undefined;
    this.service.getSbomReportImageDtos(params).subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  getFullSbomDto(digest?: string, selectedNamespace?: string) {
    if (digest && selectedNamespace) {
      this.service.getSbomReportDtoByDigestNamespace({ digest: digest, namespaceName: selectedNamespace }).subscribe({
        next: (res) => this.onGetSbomReportDtoByDigestNamespace(res),
        error: (err) => console.error(err),
      });
    }
    // this.resetAllRelatedData();
  }

  onGetSbomReportDtoByDigestNamespace(fullSbomDataDto: SbomReportDto) {
    this.fullSbomDataDto = fullSbomDataDto;
    this.onActiveNodeIdChange(fullSbomDataDto.rootNodeBomRef ?? "");
  }

  onGetDataDtos(dtos: SbomReportImageDto[]) {
    this.dataDtos = dtos;
    this.getNamespacedImageDtos();
  }

  onRefreshRequested() {
    this.dataDtos = undefined;
    this.namespacedImageDtos = undefined;
    this.resetAllRelatedData();

    this.getTableDataDtos();
  }

  private resetAllRelatedData() {
    this.fullSbomDataDto = undefined;
    this.dependsOnBoms = undefined;
    this.deletedDependsOnBom = [];
    this.nodeDataDtos = [];
    this.sbomReportDetailLicensesTreeNodes = [];
    this.sbomReportDetailPropertiesTreeNodes = [];
    this.sbomReportDetailStatistics = [];
  }

  getNamespacedImageDtos() {
    this.namespacedImageDtos = this.dataDtos
      ?.map((x) => ({
        uid: x.uid ?? '', resourceNamespace: x.resourceNamespace ?? '',
        imageName: x.imageName ?? '', imageTag: x.imageTag ?? '',
        icon: x.hasVulnerabilities ? faShieldHalved : undefined,
      } as NamespacedImageDto)) ?? [];
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
      case "goToDetailedPage":
        this.goToDetailedPage();
        break;
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
      case "Go to Vulnerability Report \u29C9":
        this.goToVr();
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
      this.sbomReportDetailStatistics.push(this.dataDtos?.find(x => x.uid === this.selectedSbomReportImageDto?.uid)?.criticalCount ?? -1);
      this.sbomReportDetailStatistics.push(this.dataDtos?.find(x => x.uid === this.selectedSbomReportImageDto?.uid)?.highCount ?? -1);
      this.sbomReportDetailStatistics.push(this.dataDtos?.find(x => x.uid === this.selectedSbomReportImageDto?.uid)?.mediumCount ?? -1);
      this.sbomReportDetailStatistics.push(this.dataDtos?.find(x => x.uid === this.selectedSbomReportImageDto?.uid)?.lowCount ?? -1);
      this.sbomReportDetailStatistics.push(this.dataDtos?.find(x => x.uid === this.selectedSbomReportImageDto?.uid)?.unknownCount ?? -1);

      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.length ?? 0);
      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.map(item => item.dependsOn)
        .filter((deps): deps is Array<string> => Array.isArray(deps))
        .reduce((sum, deps) => sum + deps.length, 0) ?? 0);
    }

    this.isSbomReportOverviewDialogVisible = true;
  }

  onExportCycloneDXJSON(contentType: 'json' | 'xml') {
    const apiRoot = this.service.rootUrl;
    const namespaceName = encodeURIComponent(this.selectedSbomReportImageDto?.resourceNamespace ?? "");
    const digest = encodeURIComponent(this.selectedSbomReportImageDto?.imageDigest ?? "");
    const fileUrl = `${apiRoot}/api/sbom-reports/cyclonedx?digest=${digest}&namespaceName=${namespaceName}`;

    const headers = new HttpHeaders({
      'Accept': contentType === 'json' ? 'application/json' : 'application/xml'
    });

    this.http.get(fileUrl, { headers, responseType: 'text' }).subscribe({
      next: (response: string) => {
        const imageNameTag = `${this.selectedSbomReportImageDto?.imageName}:${this.selectedSbomReportImageDto?.imageTag}`
        const blob = new Blob([response], { type: contentType === 'json' ? 'application/json' : 'application/xml' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        link.download = `sbom_cyclonedx_${imageNameTag}.${contentType}`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(`Error fetching the file as ${contentType.toUpperCase()}:`, err);
      }
    });
  }

  private goToVr() {
    if (this.isStatic) {
      return;
    }
    const digest = this.selectedSbomReportImageDto?.imageDigest;
    const namespace = this.selectedSbomReportImageDto?.resourceNamespace ?? "";
    if (digest && namespace && this.selectedSbomReportImageDto?.hasVulnerabilities) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/vulnerability-reports'], { queryParams: { namespaceName: namespace, digest: digest } })
      );
      window.open(url, '_blank');
    }
  }

  private goToDetailedPage() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/vulnerability-reports-detailed'])
    );
    window.open(url, '_blank');
  }

  /**
   * Get Properties TreeNodes
   * First, it creates a Map<> with all PropertyName and {propertyValue, usedBy} - usedBy is the SbomDetail Name
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
  // endregion

  // screen size
  @HostListener('window:resize', [])
  onResize() {
    this.screenSize = this.getScreenSize();
  }

  getScreenSize(): string {
    const cssVarValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--tod-screen-width-xs')
      .trim(); // Get and clean the CSS variable value

    const threshold = parseInt(cssVarValue, 10); // Convert it to a number

    return window.innerWidth < threshold ? 'sm' : 'lg';
  }
}
