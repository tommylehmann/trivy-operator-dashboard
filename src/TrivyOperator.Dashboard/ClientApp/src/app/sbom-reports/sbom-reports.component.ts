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
  dataDtos: SbomReportDto[] | null = null;
  activeNamespaces: string[] | undefined = [];
  imageDtos: ImageDto[] | undefined = [];
  hoveredSbomDetailDto: SbomReportDetailDto | undefined = undefined;

  get selectedNamespace(): string | null {
    return this._selectedNamespace;
  }
  set selectedNamespace(value: string | null) {
    this._selectedNamespace = value;
  }
  private _selectedNamespace: string | null = '';

  get selectedImageDto(): ImageDto | null {
    return this._imageDto;
  }
  set selectedImageDto(value: ImageDto | null) {
    this._imageDto = value;
    this.getFullSbomDto(value?.uid);
  }
  private _imageDto: ImageDto | null = null;

  set selectedInnerNodeId(value: string | undefined) {
    this._selectedInnerNodeId = value;
    this.selectedSbomDetailDto = this.fullSbomDataDto?.details?.find((x) => x.bomRef == value);
    if (value) {
      this.getDependsOnBoms(value);
    }
  }

  get selectedInnerNodeId(): string | undefined {
    return this._selectedInnerNodeId;
  }

  private _selectedInnerNodeId: string | undefined = undefined;

  selectedSbomDetailDto: SbomReportDetailDto | undefined = undefined;
  dependsOnBoms: SbomReportDetailDto[] = [];

  public mainTableColumns: TrivyTableColumn[] = [];
  public mainTableOptions: TrivyTableOptions;
  public isMainTableLoading: boolean = true;

  dependsOnTableColumns: TrivyTableColumn[] = [];
  dependsOnTableOptions: TrivyTableOptions;

  private readonly _rootNodeId: string = '00000000-0000-0000-0000-000000000000';

  set selectedDataDto(dataDto: SbomReportDto | null) {
    this.getFullSbomDto(dataDto?.uid);
  }

  private _selectedDataDto: SbomReportDto | null = null;

  fullSbomDataDto: SbomReportDto | null = null;
  nodeDataDtos: NodeDataDto[] = [];

  constructor(private service: SbomReportService) {
    this.getTableDataDtos();

    this.mainTableColumns = [
      {
        field: 'resourceNamespace',
        header: 'NS',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'namespaces',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'standard',
      },
      {
        field: 'imageName',
        header: 'Image Name - Tag',
        isFiltrable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'white-space: normal;',
        renderType: 'imageNameTag',
        extraFields: ['imageTag', 'imageEosl'],
      },
    ];
    this.mainTableOptions = {
      isClearSelectionVisible: false,
      isExportCsvVisible: false,
      isResetFiltersVisible: true,
      isRefreshVisible: true,
      isRefreshFiltrable: false,
      isFooterVisible: true,
      tableSelectionMode: 'single',
      tableStyle: {},
      stateKey: 'SBOM Reports - Main',
      dataKey: null,
      rowExpansionRender: null,
      extraClasses: 'trivy-half',
    };

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

    ];
    this.dependsOnTableOptions = {
      isClearSelectionVisible: false,
      isExportCsvVisible: false,
      isResetFiltersVisible: true,
      isRefreshVisible: false,
      isRefreshFiltrable: false,
      isFooterVisible: true,
      tableSelectionMode: null,
      tableStyle: {},
      stateKey: 'SBOM Reports - Depends On',
      dataKey: null,
      rowExpansionRender: null,
      extraClasses: 'trivy-half',
    };
  }

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
    this.selectedInnerNodeId = undefined;
    this.nodeDataDtos = [];
  }

  onGetSbomReportDtoByUid(fullSbomDataDto: SbomReportDto) {
    this.fullSbomDataDto = fullSbomDataDto;
    this.selectedInnerNodeId = this._rootNodeId;
    this.nodeDataDtos = this.getNodeDataDtos(fullSbomDataDto);
  }

  onGetDataDtos(dtos: SbomReportDto[]) {
    this.dataDtos = dtos;
    this.isMainTableLoading = false;
  }

  onMainTableSelectionChange(event: SbomReportDto[]) {
    if (event == null || event.length == 0) {
      this.selectedDataDto = null;
      return;
    } else {
      this.selectedDataDto = event[0];
    }
  }

  public onRefreshRequested(event: TrivyFilterData) {
    this.isMainTableLoading = true;
    this.service.getSbomReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

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

  getDependsOnBoms(bomRef: string) {
    const details = this.fullSbomDataDto?.details;
    let sboms: SbomReportDetailDto[] = [];

    if (details) {
      const foundItem = details.find((x) => x.bomRef == bomRef);

      if (foundItem && foundItem.dependsOn) {
        sboms = foundItem.dependsOn.map((dep) => {
          return details.find((y) => y.bomRef == dep);
        }).filter((x) => x !== undefined);
      }
    }

    this.dependsOnBoms = sboms;

  }

  public sanitizePropertyName(value: string | null | undefined): string | null | undefined {
    return value?.replaceAll(':', ' ')
      .replaceAll('.', '-')
      .replaceAll('@', '-');
  }

  public sanitizePropertyValue(value: string | null | undefined): string | null | undefined {
    return value?.replaceAll('@', ' [@] ')
      .replaceAll('sha256:', ' [sha256:] ');
  }

  severityWrapperGetCssColor(severityId: number): string {
    return SeverityUtils.getCssColor(severityId);
  }

  onHoveredNodeDtoChange(event: NodeDataDto | undefined) {
    this.hoveredSbomDetailDto = this.getSbomDetailDtoByBomref(event?.id);
  }

  private getSbomDetailDtoByBomref(bomref: string | undefined): SbomReportDetailDto | undefined {
    return this.fullSbomDataDto?.details?.find(x => x.bomRef == bomref);
  }

  private getNodeDataDtos(fullSbom: SbomReportDto | undefined): NodeDataDto[] {
    if (!fullSbom) {
      return [];
    }

    return fullSbom.details?.map((x) =>
      ({ id: x.bomRef, dependsOn: x.dependsOn, name: x.name, groupName: "" })) ?? [];
  }
}
