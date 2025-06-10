import { Component } from '@angular/core';

import { ClusterRbacAssessmentReportDenormalizedDto } from '../../api/models/cluster-rbac-assessment-report-denormalized-dto';
import { SeverityDto } from '../../api/models/severity-dto';
import { ClusterRbacAssessmentReportService } from '../../api/services/cluster-rbac-assessment-report.service';

import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyTableColumn } from '../trivy-table/trivy-table.types';

@Component({
  selector: 'app-cluster-rbac-assessment-reports-detailed',
  standalone: true,
  imports: [TrivyTableComponent],
  templateUrl: './cluster-rbac-assessment-reports-detailed.component.html',
  styleUrl: './cluster-rbac-assessment-reports-detailed.component.scss',
})
export class ClusterRbacAssessmentReportsDetailedComponent {
  public dataDtos?: ClusterRbacAssessmentReportDenormalizedDto[] | null;
  public severityDtos: SeverityDto[] = [];
  public activeNamespaces: string[] = [];
  public isLoading: boolean = false;

  public csvFileName: string = 'Cluster.Rbac.Assessment.Reports';

  public trivyTableColumns: TrivyTableColumn[];

  constructor(private dataDtoService: ClusterRbacAssessmentReportService) {
    this.getTableDataDtos();

    this.trivyTableColumns = [
      {
        field: 'resourceName',
        header: 'Name',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 240px; max-width: 240px; white-space: normal;',
        renderType: 'standard',
      },
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
      {
        field: 'messages',
        header: 'Messages',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 500px; max-width: 500px; white-space: normal;',
        renderType: 'multiline',
      },
    ];
  }

  public getTableDataDtos() {
    this.isLoading = true;
    this.dataDtoService.getClusterRbacAssessmentReportDenormalizedDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: ClusterRbacAssessmentReportDenormalizedDto[]) {
    this.dataDtos = dtos;
    this.isLoading = false;
  }
}
