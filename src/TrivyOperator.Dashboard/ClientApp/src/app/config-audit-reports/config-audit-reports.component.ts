import { Component, OnInit } from '@angular/core';

import { GetConfigAuditReportDtos$Params } from '../../api/fn/config-audit-report/get-config-audit-report-dtos';
import { ConfigAuditReportDto } from '../../api/models/config-audit-report-dto';
import { ConfigAuditReportService } from '../../api/services/config-audit-report.service';
import { GenericMasterDetailComponent } from '../generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn } from '../trivy-table/trivy-table.types';
import { SeverityUtils } from '../utils/severity.utils';
import { ActivatedRoute } from '@angular/router';
import { VulnerabilityReportImageDto } from '../../api/models/vulnerability-report-image-dto';

@Component({
  selector: 'app-config-audit-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './config-audit-reports.component.html',
  styleUrl: './config-audit-reports.component.scss',
})
export class ConfigAuditReportsComponent implements OnInit {
  public dataDtos: ConfigAuditReportDto[] = [];
  public activeNamespaces?: string[] = [];

  public mainTableColumns: TrivyTableColumn[] = [];
  public isMainTableLoading: boolean = true;

  public detailsTableColumns: TrivyTableColumn[] = [];

  queryUid?: string;
  isSingleMode: boolean = false;
  singleSelectDataDto?: ConfigAuditReportDto;

  constructor(private dataDtoService: ConfigAuditReportService, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryUid = params.get('uid') ?? undefined;
    });
    this.isSingleMode = !!(this.queryUid);


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
        field: 'resourceName',
        header: 'Name',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 265px; max-width: 265px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'resourceKind',
        header: 'Kind',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 100px; max-width: 100px;',
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
        field: 'checkId',
        header: 'Id',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 95px; max-width: 95px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'title',
        header: 'Title',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 180px; max-width: 180px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'description',
        header: 'Description',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 360px; max-width: 360px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'remediation',
        header: 'Remediation',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 360px; max-width: 360px; white-space: normal;',
        renderType: 'standard',
      },
    ];
  }

  ngOnInit() {
    this.dataDtoService.getConfigAuditReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.dataDtoService.getConfigAuditReportActiveNamespaces().subscribe({
      next: (res) => this.onGetActiveNamespaces(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: ConfigAuditReportDto[]) {
    this.dataDtos = dtos;
    this.singleSelectDataDto = dtos.find(x => x.uid == this.queryUid);
  }

  onGetDataDto(dto: ConfigAuditReportDto) {
    this.singleSelectDataDto = dto;
  }

  onGetActiveNamespaces(activeNamespaces: string[]) {
    this.activeNamespaces = activeNamespaces.sort((x, y) => (x > y ? 1 : -1));
  }

  public onRefreshRequested(event: TrivyFilterData) {
    const excludedSeverities =
      SeverityUtils.getSeverityIds().filter((severityId) => !event.selectedSeverityIds.includes(severityId)) || [];

    const params: GetConfigAuditReportDtos$Params = {
      namespaceName: event.namespaceName ?? undefined,
      excludedSeverities: excludedSeverities.length > 0 ? excludedSeverities.join(',') : undefined,
    };
    this.isMainTableLoading = true;
    this.dataDtoService.getConfigAuditReportDtos(params).subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }
}
