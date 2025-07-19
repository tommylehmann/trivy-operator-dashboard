import { Component, inject, OnInit } from '@angular/core';

import { ClusterRbacAssessmentReportDto } from '../../../api/models/cluster-rbac-assessment-report-dto';
import { ClusterRbacAssessmentReportService } from '../../../api/services/cluster-rbac-assessment-report.service';
import { GenericMasterDetailComponent } from '../../ui-elements/generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';
import {
  rbacAssessmentReportColumns,
  rbacAssessmentReportDetailColumns,
} from '../constants/rbac-assessment-reports.constants';

@Component({
  selector: 'app-cluster-rbac-assessment-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './cluster-rbac-assessment-reports.component.html',
  styleUrl: './cluster-rbac-assessment-reports.component.scss',
})
export class ClusterRbacAssessmentReportsComponent implements OnInit {
  dataDtos: ClusterRbacAssessmentReportDto[] = [];

  mainTableColumns: TrivyTableColumn[] = [...rbacAssessmentReportColumns];
  isMainTableLoading: boolean = true;

  detailsTableColumns: TrivyTableColumn[] = [...rbacAssessmentReportDetailColumns];

  private readonly dataDtoService = inject(ClusterRbacAssessmentReportService);

  ngOnInit() {
    this.getDataDtos();
  }

  private getDataDtos() {
    this.isMainTableLoading = true;
    this.dataDtoService.getClusterRbacAssessmentReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  private onGetDataDtos(dtos: ClusterRbacAssessmentReportDto[]) {
    this.dataDtos = dtos;
    this.isMainTableLoading = false;
  }

  public onRefreshRequested(_event: TrivyFilterData) {
    this.getDataDtos();
  }
}
