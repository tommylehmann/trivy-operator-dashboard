import { Component, inject, OnInit } from '@angular/core';

import { RbacAssessmentReportDto } from '../../../api/models/rbac-assessment-report-dto';
import { RbacAssessmentReportService } from '../../../api/services/rbac-assessment-report.service';
import { namespacedColumns } from '../constants/generic.constants';
import { rbacAssessmentReportColumns, rbacAssessmentReportDetailColumns } from '../constants/rbac-assessment-reports.constants'

import { GenericMasterDetailComponent } from '../../ui-elements/generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';

@Component({
  selector: 'app-rbac-assessment-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './rbac-assessment-reports.component.html',
  styleUrl: './rbac-assessment-reports.component.scss',
})
export class RbacAssessmentReportsComponent implements OnInit {
  dataDtos: RbacAssessmentReportDto[] = [];
  activeNamespaces?: string[] = [];

  mainTableColumns: TrivyTableColumn[] = [...namespacedColumns, ...rbacAssessmentReportColumns];
  isMainTableLoading: boolean = true;

  detailsTableColumns: TrivyTableColumn[] = [...rbacAssessmentReportDetailColumns];

  private readonly dataDtoService = inject(RbacAssessmentReportService);

  ngOnInit() {
    this.getTableDataDtos();
  }

  private getTableDataDtos() {
    this.isMainTableLoading = true;
    this.dataDtoService.getRbacAssessmentReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  private onGetDataDtos(dtos: RbacAssessmentReportDto[]) {
    this.dataDtos = dtos;
    this.activeNamespaces = Array
      .from(new Set(dtos.map(dto => dto.resourceNamespace ?? "N/A")))
      .sort();
    this.isMainTableLoading = false;
  }

  onRefreshRequested(_event: TrivyFilterData) {
    this.getTableDataDtos();
  }
}
