import { Component } from '@angular/core';

import { ClusterRbacAssessmentReportDto } from '../../../api/models/cluster-rbac-assessment-report-dto';
import { ClusterRbacAssessmentReportService } from '../../../api/services/cluster-rbac-assessment-report.service';
import { GenericMasterDetailComponent } from '../../ui-elements/generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';

@Component({
  selector: 'app-cluster-rbac-assessment-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './cluster-rbac-assessment-reports.component.html',
  styleUrl: './cluster-rbac-assessment-reports.component.scss',
})
export class ClusterRbacAssessmentReportsComponent {
  public dataDtos: ClusterRbacAssessmentReportDto[] = [];

  public mainTableColumns: TrivyTableColumn[] = [];
  public isMainTableLoading: boolean = true;

  public detailsTableColumns: TrivyTableColumn[] = [];

  constructor(private dataDtoService: ClusterRbacAssessmentReportService) {
    dataDtoService.getClusterRbacAssessmentReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.mainTableColumns = [
      {
        field: 'resourceName',
        header: 'Name',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 390px; max-width: 390px; white-space: normal;',
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

  onGetDataDtos(dtos: ClusterRbacAssessmentReportDto[]) {
    this.dataDtos = dtos;
  }

  public onRefreshRequested(_event: TrivyFilterData) {
    this.dataDtoService.getClusterRbacAssessmentReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }
}
