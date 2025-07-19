import { Component, inject, OnInit } from '@angular/core';

import { GetConfigAuditReportDtos$Params } from '../../../api/fn/config-audit-report/get-config-audit-report-dtos';
import { ConfigAuditReportDto } from '../../../api/models/config-audit-report-dto';
import { ConfigAuditReportService } from '../../../api/services/config-audit-report.service';
import { GenericMasterDetailComponent } from '../../ui-elements/generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';
import { SeverityUtils } from '../../utils/severity.utils';
import { ActivatedRoute } from '@angular/router';
import { namespacedColumns } from '../constants/generic.constants';
import { configAuditReportColumns, configAuditReportDetailColumns } from '../constants/config-audit-reports.constants';

@Component({
  selector: 'app-config-audit-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './config-audit-reports.component.html',
  styleUrl: './config-audit-reports.component.scss',
})
export class ConfigAuditReportsComponent implements OnInit {
  dataDtos: ConfigAuditReportDto[] = [];
  activeNamespaces?: string[] = [];

  mainTableColumns: TrivyTableColumn[] = [...namespacedColumns, ...configAuditReportColumns];
  isMainTableLoading: boolean = true;

  detailsTableColumns: TrivyTableColumn[] = [...configAuditReportDetailColumns];

  queryUid?: string;
  isSingleMode: boolean = false;
  singleSelectDataDto?: ConfigAuditReportDto;

  private readonly dataDtoService = inject(ConfigAuditReportService);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryUid = params.get('uid') ?? undefined;
    });
    this.isSingleMode = !!(this.queryUid);
    this.getDataDtos();
  }

  getDataDtos(params?: GetConfigAuditReportDtos$Params) {
    this.isMainTableLoading = true;
    this.dataDtoService.getConfigAuditReportDtos(params).subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: ConfigAuditReportDto[]) {
    this.dataDtos = dtos;
    this.activeNamespaces = Array
      .from(new Set(dtos.map(dto => dto.resourceNamespace ?? "N/A")))
      .sort();
    this.singleSelectDataDto = dtos.find(x => x.uid == this.queryUid);
    this.isMainTableLoading = false;
  }

  public onRefreshRequested(event: TrivyFilterData) {
    const excludedSeverities =
      SeverityUtils.getSeverityIds().filter((severityId) => !event.selectedSeverityIds.includes(severityId)) || [];

    const params: GetConfigAuditReportDtos$Params = {
      namespaceName: event.namespaceName ?? undefined,
      excludedSeverities: excludedSeverities.length > 0 ? excludedSeverities.join(',') : undefined,
    };
    this.getDataDtos(params);
  }
}
