import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { GetExposedSecretReportImageDtos$Params } from '../../../api/fn/exposed-secret-report/get-exposed-secret-report-image-dtos';
import { ExposedSecretReportImageDto } from '../../../api/models/exposed-secret-report-image-dto';
import { ExposedSecretReportService } from '../../../api/services/exposed-secret-report.service';
import { GenericMasterDetailComponent } from '../../ui-elements/generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn, TrivyTableExpandRowData } from '../../ui-elements/trivy-table/trivy-table.types';
import { SeverityUtils } from '../../utils/severity.utils';

import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { VulnerabilityReportImageDto } from '../../../api/models/vulnerability-report-image-dto';
import { ActivatedRoute } from '@angular/router';
import { ReportHelper, TrivyReportImageDto } from '../abstracts/trivy-report-image';
import { VulnerabilityReportImageResourceDto } from '../../../api/models/vulnerability-report-image-resource-dto';
import { namespacedColumns } from '../constants/generic.constants';
import {
  exposedSecretReportColumns,
  exposedSecretReportDetailColumns,
} from '../constants/exposed-secret-reports.constants';

@Component({
  selector: 'app-exposed-secret-reports',
  standalone: true,
  imports: [CommonModule, GenericMasterDetailComponent, DialogModule, TableModule],
  templateUrl: './exposed-secret-reports.component.html',
  styleUrl: './exposed-secret-reports.component.scss',
})
export class ExposedSecretReportsComponent implements OnInit {
  dataDtos: ExposedSecretReportImageDto[] = [];
  activeNamespaces?: string[] = [];

  mainTableColumns: TrivyTableColumn[] = [...namespacedColumns, ...exposedSecretReportColumns];
  mainTableExpandCallbackDto?: ExposedSecretReportImageDto;
  isMainTableLoading: boolean = true;

  detailsTableColumns: TrivyTableColumn[] = [...exposedSecretReportDetailColumns];

  isImageUsageDialogVisible: boolean = false;

  queryNamespaceName?: string;
  queryDigest?: string;
  isSingleMode: boolean = false;
  singleSelectDataDto?: ExposedSecretReportImageDto;

  private readonly dataDtoService = inject(ExposedSecretReportService);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryNamespaceName = params.get('namespaceName') ?? undefined;
      this.queryDigest = params.get('digest') ?? undefined;
    });
    this.isSingleMode = !!(this.queryNamespaceName && this.queryDigest);
    this.getDataDtos();
  }

  private getDataDtos() {
    this.isMainTableLoading = true;
    this.dataDtoService.getExposedSecretReportImageDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  private onGetDataDtos(dtos: ExposedSecretReportImageDto[]) {
    this.dataDtos = dtos;
    this.activeNamespaces = Array
      .from(new Set(dtos.map(dto => dto.resourceNamespace ?? "N/A")))
      .sort();
    if (this.isSingleMode) {
      this.singleSelectDataDto = dtos
        .find(x => x.imageDigest == this.queryDigest && x.resourceNamespace == this.queryNamespaceName);
    }
    this.isMainTableLoading = false;
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
          ReportHelper.getNarrowedResourceNames(
            dto as TrivyReportImageDto<VulnerabilityReportImageResourceDto>),
        ],
      ]
    }
  }
}
