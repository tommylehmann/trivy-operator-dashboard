import { Component } from '@angular/core';

import { RbacAssessmentReportDenormalizedDto } from '../../api/models/rbac-assessment-report-denormalized-dto';
import { SeverityDto } from '../../api/models/severity-dto';
import { RbacAssessmentReportService } from '../../api/services/rbac-assessment-report.service';

import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { ExportColumn, TrivyTableColumn, TrivyTableOptions } from '../trivy-table/trivy-table.types';
import { TrivyTableUtils } from '../utils/trivy-table.utils';



@Component({
  selector: 'app-tests',
  imports: [TrivyTableComponent],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.scss'
})
export class TestsComponent {
  public dataDtos?: RbacAssessmentReportDenormalizedDto[] | null;
  public severityDtos: SeverityDto[] = [];
  public activeNamespaces: string[] = [];
  public isLoading: boolean = false;

  public csvFileName: string = 'Rbac.Assessment.Reports';

  public exportColumns: ExportColumn[];

  public trivyTableColumns: TrivyTableColumn[];
  public trivyTableOptions: TrivyTableOptions;

  constructor(private dataDtoService: RbacAssessmentReportService) {
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
    this.trivyTableOptions = {
      isClearSelectionVisible: false,
      isExportCsvVisible: true,
      isResetFiltersVisible: true,
      isRefreshVisible: true,
      isRefreshFilterable: false,
      isFooterVisible: true,
      tableSelectionMode: null,
      tableStyle: { width: '2100px' },
      stateKey: 'RBAC Assessment Reports Detailed',
      dataKey: 'uid',
      rowExpansionRender: 'test',
      extraClasses: '',
    };
    this.exportColumns = TrivyTableUtils.convertFromTableColumnToExportColumn(this.trivyTableColumns);
  }

  public getTableDataDtos() {
    this.isLoading = true;
    this.dataDtoService.getRbacAssessmentReportDenormalizedDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
    this.dataDtoService.getRbacAssessmentReportActiveNamespaces().subscribe({
      next: (res) => this.onGetActiveNamespaces(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: RbacAssessmentReportDenormalizedDto[]) {
    this.dataDtos = dtos;
    this.isLoading = false;
  }

  onGetActiveNamespaces(activeNamespaces: string[]) {
    this.activeNamespaces = activeNamespaces.sort((x, y) => (x > y ? 1 : -1));
  }

  // TODO: row expand tests
  rowExpandResponse?: {rowKey: RbacAssessmentReportDenormalizedDto, info: string};
  onRowExpandChange(event: RbacAssessmentReportDenormalizedDto) {
    console.log("onRowExpandChange", event.uid);
    this.rowExpandResponse = {rowKey: event, info: event.uid ?? ''};
  }
}
