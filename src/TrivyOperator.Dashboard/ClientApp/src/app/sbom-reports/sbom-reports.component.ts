import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SbomReportDetailDto } from '../../api/models/sbom-report-detail-dto';
import { SbomReportDto } from '../../api/models/sbom-report-dto';
import { SbomReportService } from '../../api/services/sbom-report.service';

import { FcoseComponent } from '../fcose/fcose.component';
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyFilterData, TrivyTableColumn, TrivyTableOptions } from '../trivy-table/trivy-table.types';

import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { SeverityUtils } from '../utils/severity.utils';
import { NodeDataDefinition } from 'cytoscape';
import { NodeDataDto } from '../fcose/fcose.types';
import { SbomDetailExtendedDto } from './sbom-reports.types'

export interface ImageDto {
  uid: string;
  imageNameTag: string;
}

export interface DependsOn {
  bomRef: string;
  name: string;
  version: string;
}

@Component({
  selector: 'app-sbom-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, FcoseComponent, TrivyTableComponent, DropdownModule, CardModule, PanelModule, TableModule, TagModule],
  templateUrl: './sbom-reports.component.html',
  styleUrl: './sbom-reports.component.scss',
})
export class SbomReportsComponent {
  // #region main data - SbomReportDtos, activeNS, fullSbomDataDto, table data
  dataDtos: SbomReportDto[] | null = null;
  activeNamespaces: string[] | undefined = [];
  fullSbomDataDto: SbomReportDto | null = null;
  tableDataDtos: SbomReportDetailDto[] | null = null;
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
    this.getFullSbomDto(value?.uid);
  }
  private _imageDto: ImageDto | null = null;
  // #endregion
  // #region dependsOnTable data
  selectedSbomDetailDto: SbomReportDetailDto | undefined = undefined;
  dependsOnBoms?: SbomDetailExtendedDto[];

  dependsOnTableColumns: TrivyTableColumn[] = [];
  dependsOnTableOptions: TrivyTableOptions;
  // #endregion

  imageDtos: ImageDto[] | undefined = []; // filtered images by ns
  hoveredSbomDetailDto: SbomReportDetailDto | undefined = undefined;
  nodeDataDtos: NodeDataDto[] = [];

  private readonly _rootNodeId: string = '00000000-0000-0000-0000-000000000000';

  constructor(private service: SbomReportService) {
    this.getTableDataDtos();

    this.dependsOnTableColumns = [
      {
        field: 'name',
        header: 'Name',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'white-space: nowrap; text-overflow: ellipsis; overflow: hidden; width: 290px; max-width: 290px',
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
        isSortIconVisible: false,
        multiSelectType: 'none',
        style: 'width: 40px; max-width: 40px;',
        renderType: 'severityValue',
        extraFields: ['CRITICAL'],
      },
      {
        field: 'highCount',
        header: 'H',
        isFiltrable: false,
        isSortable: true,
        isSortIconVisible: false,
        multiSelectType: 'none',
        style: 'width: 40px; max-width: 40px;',
        renderType: 'severityValue',
        extraFields: ['HIGH'],
      },
      {
        field: 'mediumCount',
        header: 'M',
        isFiltrable: false,
        isSortable: true,
        isSortIconVisible: false,
        multiSelectType: 'none',
        style: 'width: 40px; max-width: 40px;',
        renderType: 'severityValue',
        extraFields: ['MEDIUM'],
      },
      {
        field: 'lowCount',
        header: 'L',
        isFiltrable: false,
        isSortable: true,
        isSortIconVisible: false,
        multiSelectType: 'none',
        style: 'width: 40px; max-width: 40px;',
        renderType: 'severityValue',
        extraFields: ['LOW'],
      },
      {
        field: 'unknownCount',
        header: 'U',
        isFiltrable: false,
        isSortable: true,
        isSortIconVisible: false,
        multiSelectType: 'none',
        style: 'width: 40px; max-width: 40px;',
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
      tableStyle: {},
      stateKey: 'SBOM Reports - Depends On',
      dataKey: null,
      rowExpansionRender: null,
      extraClasses: 'trivy-half',
    };
  }

  // #region get data from api
  getTableDataDtos() {
    this.service.getSbomReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.service.getSbomReportActiveNamespaces().subscribe({
      next: (res) => (this.activeNamespaces = res.sort()),
      error: (err) => console.error(err),
    });
  }

  getFullSbomDto(uid: string | null | undefined) {
    if (uid) {
      this.service.getSbomReportDtoByUid({ uid: uid }).subscribe({
        next: (res) => this.onGetSbomReportDtoByUid(res),
        error: (err) => console.error(err),
      });
    }
    this.fullSbomDataDto = null;
    this.nodeDataDtos = [];
  }

  onGetSbomReportDtoByUid(fullSbomDataDto: SbomReportDto) {
    this.fullSbomDataDto = fullSbomDataDto;
    this.onActiveNodeIdChange(this._rootNodeId);
  }

  onGetDataDtos(dtos: SbomReportDto[]) {
    this.dataDtos = dtos;
  }

  public onRefreshRequested(event: TrivyFilterData) {
    this.service.getSbomReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }
  // #endregion

  // #region Get Parent and Children Nodes
  private getDataDtosByNodeId(nodeId: string) {
    this.isTableLoading = true;
    this.dependsOnBoms = undefined;
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
        id: x.bomRef,
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
      .map((x) => ({ uid: x.uid ?? '', imageNameTag: `${x.imageName}:${x.imageTag}` }))
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

  onHoveredNodeDtoChange(event: NodeDataDto | undefined) {
    this.hoveredSbomDetailDto = this.getSbomDetailDtoByBomref(event?.id);
  }

  private getSbomDetailDtoByBomref(bomref: string | undefined): SbomReportDetailDto | undefined {
    return this.fullSbomDataDto?.details?.find(x => x.bomRef == bomref);
  }

  onActiveNodeIdChange(event: string) {
    this.selectedSbomDetailDto = this.fullSbomDataDto?.details?.find((x) => x.bomRef == event);
    if (this.selectedSbomDetailDto) {
      this.getDataDtosByNodeId(event);
    }
  }

  private getGroupFromSbomReportDetail(dto: SbomReportDetailDto): string {
    if (dto.purl?.startsWith('pkg:nuget/')) {
      return dto.name?.split('.')[0] ?? "";
    }
    return "";
  }

  onTableSelectedRowChange(data: SbomReportDetailDto[]) {
    //console.log(data);
  }
}
