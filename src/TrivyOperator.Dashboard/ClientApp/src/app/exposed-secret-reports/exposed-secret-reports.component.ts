import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { GetExposedSecretReportImageDtos$Params } from '../../api/fn/exposed-secret-report/get-exposed-secret-report-image-dtos';
import { ExposedSecretReportImageDto } from '../../api/models/exposed-secret-report-image-dto';
import { ExposedSecretReportService } from '../../api/services/exposed-secret-report.service';
import { GenericMasterDetailComponent } from '../generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn, TrivyTableExpandRowData } from '../trivy-table/trivy-table.types';
import { SeverityUtils } from '../utils/severity.utils';

import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { VulnerabilityReportImageDto } from '../../api/models/vulnerability-report-image-dto';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exposed-secret-reports',
  standalone: true,
  imports: [CommonModule, GenericMasterDetailComponent, DialogModule, TableModule],
  templateUrl: './exposed-secret-reports.component.html',
  styleUrl: './exposed-secret-reports.component.scss',
})
export class ExposedSecretReportsComponent implements OnInit {
  public dataDtos: ExposedSecretReportImageDto[] = [];
  public activeNamespaces?: string[] = [];

  public mainTableColumns: TrivyTableColumn[] = [];
  public mainTableExpandCallbackDto?: ExposedSecretReportImageDto;
  public isMainTableLoading: boolean = true;

  public detailsTableColumns: TrivyTableColumn[] = [];

  public isImageUsageDialogVisible: boolean = false;

  queryNamespaceName?: string;
  queryDigest?: string;
  isSingleMode: boolean = false;
  singleSelectDataDto?: ExposedSecretReportImageDto;

  constructor(private dataDtoService: ExposedSecretReportService, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryNamespaceName = params.get('namespaceName') ?? undefined;
      this.queryDigest = params.get('digest') ?? undefined;
    });
    this.isSingleMode = !!(this.queryNamespaceName && this.queryDigest);

    this.mainTableColumns = [
      {
        field: 'resourceNamespace',
        header: 'NS',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'namespaces',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'standard',
      },
      {
        field: 'imageName',
        header: 'Image Name - Tag',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 265px; max-width: 265px; white-space: normal;',
        renderType: 'imageNameTag',
        extraFields: ['imageTag', 'imageEosl'],
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
    ];
    this.detailsTableColumns = [
      {
        field: 'severityId',
        header: 'Sev',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'severities',
        style: 'width: 90px; max-width: 90px;',
        renderType: 'severityBadge',
      },
      {
        field: 'category',
        header: 'Category',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 140px; max-width: 140px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'ruleId',
        header: 'Id',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 95px; max-width: 95px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'match',
        header: 'Match',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px',
        renderType: 'standard',
      },
      {
        field: 'target',
        header: 'Target',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px',
        renderType: 'standard',
      },
      {
        field: 'title',
        header: 'Title',
        isFilterable: true,
        isSortable: false,
        multiSelectType: 'none',
        style: 'min-with: 200px; white-space: normal;',
        renderType: 'standard',
      },
    ];
  }

  ngOnInit() {
    this.dataDtoService.getExposedSecretReportImageDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.dataDtoService.getExposedSecretReportActiveNamespaces().subscribe({
      next: (res) => this.onGetActiveNamespaces(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(vrDtos: ExposedSecretReportImageDto[]) {
    this.dataDtos = vrDtos;
    if (this.isSingleMode) {
      this.singleSelectDataDto = vrDtos
        .find(x => x.imageDigest == this.queryDigest && x.resourceNamespace == this.queryNamespaceName);
    }
  }

  onGetActiveNamespaces(activeNamespaces: string[]) {
    this.activeNamespaces = activeNamespaces.sort((x, y) => (x > y ? 1 : -1));
  }

  onMainTableExpandCallback(dto: ExposedSecretReportImageDto) {
    this.mainTableExpandCallbackDto = dto;
    this.isImageUsageDialogVisible = true;
  }

  onRefreshRequested(event: TrivyFilterData) {
    const excludedSeverities =
      SeverityUtils.getSeverityIds().filter((severityId) => !event.selectedSeverityIds.includes(severityId)) || [];

    const params: GetExposedSecretReportImageDtos$Params = {
      namespaceName: event.namespaceName ?? undefined,
      excludedSeverities: excludedSeverities.length > 0 ? excludedSeverities.join(',') : undefined,
    };
    this.isMainTableLoading = true;
    this.dataDtoService.getExposedSecretReportImageDtos(params).subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  getPanelHeaderText() {
    return `Image Usage for ${this.mainTableExpandCallbackDto?.imageName}:${this.mainTableExpandCallbackDto?.imageTag} in namespace ${this.mainTableExpandCallbackDto?.resourceNamespace}`;
  }

  rowExpandResponse?: TrivyTableExpandRowData<ExposedSecretReportImageDto>;
  onRowExpandChange(dto: ExposedSecretReportImageDto) {
    this.rowExpandResponse = {
      rowKey: dto,
      colStyles: [
        { 'width': '70px', 'min-width': '70px', 'height': '50px' },
        { 'white-space': 'normal', 'display': 'flex', 'align-items': 'center', 'height': '50px' }
      ],
      details: [
        // [
        //   { label: 'Image Digest' },
        //   { label: dto.imageDigest ?? '' },
        // ],
        [
          { label: 'Repository' },
          { label: dto.imageRepository ?? ''},
        ],
        // [
        //   { label: 'Update Moment' },
        //   { label: '', localTime: dto.updateTimestamp },
        // ],
        [
          { label: 'Used By' },
          this.getNarrowedResourceNamesHelper(dto),
        ],
      ]
    }
  }

  getNarrowedResourceNamesHelper(dto: ExposedSecretReportImageDto): {label: string; buttonLink: string} {
    const resourceNames: string[] = dto.resources?.map((x) => x.name ?? 'unknown') ?? [];
    let narrowedResourceNames: string = '';
    let narrowedResourceNamesLink: string | undefined = undefined;
    if (resourceNames.length > 2) {
      narrowedResourceNames = resourceNames[0] + ', ' + resourceNames[1];
      narrowedResourceNamesLink = ' [+' + (resourceNames.length - 2) + ']';
    } else {
      narrowedResourceNames = resourceNames.join(', ');
      narrowedResourceNamesLink = '[...]';
    }
    return {
      label: narrowedResourceNames,
      buttonLink: narrowedResourceNamesLink,
    }
  }
}
