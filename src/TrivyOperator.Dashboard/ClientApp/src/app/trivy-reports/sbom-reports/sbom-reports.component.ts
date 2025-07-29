import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, effect, HostListener, inject, model, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SbomReportDto } from '../../../api/models/sbom-report-dto';
import { SbomReportDetailDto } from '../../../api/models/sbom-report-detail-dto';
import { SbomReportImageDto } from '../../../api/models/sbom-report-image-dto';
import { SbomReportService } from '../../../api/services/sbom-report.service';
import { NodeDataDto } from '../../ui-elements/fcose/fcose.types';
import { SbomDetailExtendedDto } from './sbom-reports.types';
import { sbomReportDetailColumns } from '../constants/sbom-reports.constans';

import { SeverityCssStyleByIdPipe } from '../../pipes/severity-css-style-by-id.pipe';
import { SeverityNameByIdPipe } from '../../pipes/severity-name-by-id.pipe';
import { VulnerabilityCountPipe } from '../../pipes/vulnerability-count.pipe';

import { FcoseComponent } from '../../ui-elements/fcose/fcose.component';
import { NamespaceImageSelectorComponent } from '../../ui-elements/namespace-image-selector/namespace-image-selector.component';
import { NamespacedImageDto } from '../../ui-elements/namespace-image-selector/namespace-image-selector.types';
import { TrivyTableComponent } from '../../ui-elements/trivy-table/trivy-table.component';
import { TrivyTableColumn, TrivyTableExpandRowData } from '../../ui-elements/trivy-table/trivy-table.types';

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
import { ImageInfo, TrivyDependencyComponent } from '../../trivy-dependency/trivy-dependency.component';

@Component({
  selector: 'app-sbom-reports',
  standalone: true,
  imports: [FormsModule,
    FcoseComponent, NamespaceImageSelectorComponent, TrivyTableComponent, TrivyDependencyComponent,
    SeverityCssStyleByIdPipe, SeverityNameByIdPipe, VulnerabilityCountPipe,
    ButtonModule, CardModule, DialogModule, PanelModule, SelectModule, SplitterModule, TableModule, TagModule, TreeTableModule],
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
  selectedImageId = model<string | undefined>();
  // endregion
  // region dependsOnTable data
  selectedSbomDetailDto?: SbomDetailExtendedDto;
  dependsOnBoms?: SbomDetailExtendedDto[];
  deletedDependsOnBom: SbomDetailExtendedDto[] = [];

  dependsOnTableColumns: TrivyTableColumn[] = [...sbomReportDetailColumns];
  // endregion

  // region Full Sbom Report details
  isSbomReportOverviewDialogVisible: boolean = false;
  sbomReportDetailStatistics: Array<number | undefined> = [];
  sbomReportDetailPropertiesTreeNodes: TreeNode[] = [];
  sbomReportDetailLicensesTreeNodes: TreeNode[] = [];
  // endregion

  hoveredSbomDetailDto?: SbomReportDetailDto;
  nodeDataDtos: NodeDataDto[] = [];
  selectedSbomDetailBomRef?: string;

  private readonly _rootNodeId: string = '00000000-0000-0000-0000-000000000000';

  queryNamespaceName?: string;
  queryDigest?: string;
  isStatic: boolean = false;

  isDependencyTreeViewVisible: boolean = false;
  trivyImage?: ImageInfo;
  trivyDependencyDialogTitle: string = "";

  screenSize: string = this.getScreenSize();

  private readonly service = inject(SbomReportService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      const selectedImageId = this.selectedImageId();
      this.selectedSbomReportImageDto = this.dataDtos?.find(x => x.uid && x.uid === selectedImageId);
        if (this.selectedSbomReportImageDto) {
          this.resetAllRelatedData();
          this.getFullSbomDto(
            this.selectedSbomReportImageDto.imageDigest ?? undefined,
            this.selectedSbomReportImageDto.resourceNamespace ?? undefined);
        }
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryNamespaceName = params.get('namespaceName') ?? undefined;
      this.queryDigest = params.get('digest') ?? undefined;
    });

    this.isStatic = !!(this.queryNamespaceName && this.queryDigest);

    this.getTableDataDtos();
  }

  // #region get data from api
  getTableDataDtos() {
    this.service.getSbomReportImageDtos().subscribe({
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
    if (this.isStatic) {
      const queryDto = dtos
        .find(x => x.imageDigest == this.queryDigest && x.resourceNamespace == this.queryNamespaceName);
      if (queryDto) {
        this.selectedImageId.set(queryDto.uid);
      }

    }
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
        icon: x.hasVulnerabilities ? 'security' : undefined,
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
        this.exportSbom('cyclonedx','json');
        break;
      case "Export CycloneDX XML":
        this.exportSbom('cyclonedx','xml');
        break;
      case "Export SPDX":
        this.exportSbom('spdx','json');
        break;
      case "Dependency tree":
        this.goToDependencyTree();
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

  exportSbom(fileFormat: 'cyclonedx' | 'spdx', contentType: 'json' | 'xml') {
    const apiRoot = this.service.rootUrl;
    const namespaceName = encodeURIComponent(this.selectedSbomReportImageDto?.resourceNamespace ?? "");
    const digest = encodeURIComponent(this.selectedSbomReportImageDto?.imageDigest ?? "");
    const fileUrl = `${apiRoot}/api/sbom-reports/${fileFormat}?digest=${digest}&namespaceName=${namespaceName}`;

    const headers = new HttpHeaders({
      'Accept': contentType === 'json' || fileFormat === 'spdx' ? 'application/json' : 'application/xml'
    });

    this.http.get(fileUrl, { headers, responseType: 'text' }).subscribe({
      next: (response: string) => {
        const imageNameTag = `${this.selectedSbomReportImageDto?.imageName}:${this.selectedSbomReportImageDto?.imageTag}`
        const blob = new Blob([response], { type: contentType === 'json' || fileFormat === 'spdx' ? 'application/json' : 'application/xml' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        link.download = `sbom_${fileFormat}_${imageNameTag}.${contentType}`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(`Error fetching the file as ${contentType}:`, err);
      }
    });
  }

  private goToDependencyTree() {
    const digest = this.selectedSbomReportImageDto?.imageDigest;
    const namespace = this.selectedSbomReportImageDto?.resourceNamespace;
    if (digest && namespace) {
      const imageRepository = this.selectedSbomReportImageDto?.imageRepository ?? 'n/a';
      const imageName = this.selectedSbomReportImageDto?.imageName ?? 'n/a';
      const imageTag = this.selectedSbomReportImageDto?.imageTag ?? 'n/a';
      const imageNamespace = this.selectedSbomReportImageDto?.resourceNamespace ?? 'n/a';
      this.trivyDependencyDialogTitle = `Dependency Tree for Image ${imageRepository}/${imageName}:${imageTag} in ${imageNamespace}`;
      this.trivyImage = { digest: digest, namespaceName: namespace };
      this.isDependencyTreeViewVisible = true;
    }
  }

  private goToDetailedPage() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/sbom-reports-detailed'])
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

  rowExpandResponse?: TrivyTableExpandRowData<SbomDetailExtendedDto>;
  onRowExpandChange(dto: SbomDetailExtendedDto) {
    this.rowExpandResponse = {
      rowKey: dto,
      colStyles: [
        { 'width': '70px', 'min-width': '70px', 'height': '50px' },
        { 'white-space': 'normal', 'display': 'flex', 'align-items': 'center', 'height': '50px' }
      ],
      details: dto.properties?.map(x => {
        return [
          { label: x[0] ?? ''},
          { label: x[1] ?? ''},
        ]
      }) ?? []
    }
  }

  // screen size
  @HostListener('window:resize', [])
  onResize() {
    this.screenSize = this.getScreenSize();
  }

  getScreenSize(): string {
    const cssVarValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--tod-screen-width-sm')
      .trim(); // Get and clean the CSS variable value

    const threshold = parseInt(cssVarValue, 10); // Convert it to a number

    return window.innerWidth < threshold ? 'sm' : 'lg';
  }
}
