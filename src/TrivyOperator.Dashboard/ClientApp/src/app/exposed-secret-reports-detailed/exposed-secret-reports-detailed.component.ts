import { Component } from '@angular/core';

import { ExposedSecretReportDenormalizedDto } from '../../api/models/exposed-secret-report-denormalized-dto';
import { SeverityDto } from '../../api/models/severity-dto';
import { ExposedSecretReportService } from '../../api/services/exposed-secret-report.service';

import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyTableColumn } from '../trivy-table/trivy-table.types';

@Component({
  selector: 'app-exposed-secret-reports-detailed',
  standalone: true,
  imports: [TrivyTableComponent],
  templateUrl: './exposed-secret-reports-detailed.component.html',
  styleUrl: './exposed-secret-reports-detailed.component.scss',
})
export class ExposedSecretReportsDetailedComponent {
  public dataDtos?: ExposedSecretReportDenormalizedDto[] | null;
  public severityDtos: SeverityDto[] = [];
  public activeNamespaces: string[] = [];
  public isLoading: boolean = false;

  public csvFileName: string = 'Config.Audit.Reports';

  public trivyTableColumns: TrivyTableColumn[];

  constructor(private dataDtoService: ExposedSecretReportService) {
    this.getTableDataDtos();

    this.trivyTableColumns = [
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
        style: 'width: 280px; max-width: 280px;',
        renderType: 'standard',
      },
      {
        field: 'resourceKind',
        header: 'Kind',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 110px; max-width: 110px;',
        renderType: 'standard',
      },
      {
        field: 'resourceContainerName',
        header: 'Container',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 170px; max-width: 170px;',
        renderType: 'standard',
      },
      {
        field: 'imageName',
        header: 'Image',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 210px; max-width: 210px;',
        renderType: 'standard',
      },
      {
        field: 'imageTag',
        header: 'Tag',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 115px; max-width: 115px;',
        renderType: 'standard',
      },
      {
        field: 'imageRepository',
        header: 'Repository',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 220px; max-width: 220px;',
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

  public getTableDataDtos() {
    this.isLoading = true;
    this.dataDtoService.getExposedSecretReportDenormalizedDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.dataDtoService.getExposedSecretReportActiveNamespaces().subscribe({
      next: (res) => this.onGetActiveNamespaces(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: ExposedSecretReportDenormalizedDto[]) {
    this.dataDtos = dtos;
    this.isLoading = false;
  }

  onGetActiveNamespaces(dtos: string[]) {
    this.activeNamespaces = dtos.sort((x, y) => (x > y ? 1 : -1));
  }
}
