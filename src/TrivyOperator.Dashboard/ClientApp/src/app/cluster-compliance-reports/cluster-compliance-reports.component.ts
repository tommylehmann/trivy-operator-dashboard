import { Component } from '@angular/core';

import { ClusterComplianceReportDto } from '../../api/models/cluster-compliance-report-dto';
import { ClusterComplianceReportService } from '../../api/services/cluster-compliance-report.service';
import { GenericMasterDetailComponent } from '../generic-master-detail/generic-master-detail.component';
import { TrivyFilterData, TrivyTableColumn, TrivyTableExpandRowData } from '../trivy-table/trivy-table.types';

@Component({
  selector: 'app-cluster-compliance-reports',
  standalone: true,
  imports: [GenericMasterDetailComponent],
  templateUrl: './cluster-compliance-reports.component.html',
  styleUrl: './cluster-compliance-reports.component.scss',
})
export class ClusterComplianceReportsComponent {
  public dataDtos: ClusterComplianceReportDto[] = [];

  public mainTableColumns: TrivyTableColumn[] = [];
  public isMainTableLoading: boolean = true;

  public detailsTableColumns: TrivyTableColumn[] = [];

  constructor(private dataDtoService: ClusterComplianceReportService) {
    this.getDataDtos();

    this.mainTableColumns = [
      {
        field: 'name',
        header: 'Name',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px;white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'title',
        header: 'Title',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 265px; max-width: 265px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'totalFailCriticalCount',
        header: 'C',
        isFilterable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['0'],
      },
      {
        field: 'totalFailHighCount',
        header: 'H',
        isFilterable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px;',
        renderType: 'severityValue',
        extraFields: ['1'],
      },
      {
        field: 'totalFailMediumCount',
        header: 'M',
        isFilterable: false,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 50px; max-width: 50px;',
        renderType: 'severityValue',
        extraFields: ['2'],
      },
      {
        field: 'totalFailLowCount',
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
        field: 'id',
        header: 'Id',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 90px; max-width: 90px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'name',
        header: 'Name',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 320px; max-width: 320px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'description',
        header: 'Description',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'checks',
        header: 'Checks',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 140px; max-width: 140px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'commands',
        header: 'Commands',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 150px; max-width: 150px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'totalFail',
        header: 'Failed',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 140px; max-width: 140px; white-space: normal; text-align: right;',
        renderType: 'severityValue',
        extraFields: ['-1'],
      },
    ];
  }

  onGetDataDtos(dtos: ClusterComplianceReportDto[]) {
    this.dataDtos = dtos;
  }

  public onRefreshRequested(_event: TrivyFilterData) {
    this.getDataDtos();
  }

  private getDataDtos() {
    this.dataDtoService.getClusterComplianceReportDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  rowExpandResponse?: TrivyTableExpandRowData<ClusterComplianceReportDto>;
  onRowExpandChange(dto: ClusterComplianceReportDto) {
    this.rowExpandResponse = {
      rowKey: dto,
      colStyles: [
        { 'width': '70px', 'min-width': '70px', 'height': '50px' },
        { 'white-space': 'normal', 'display': 'flex', 'align-items': 'center', 'height': '50px' }
      ],
      details: [
        [
          { label: 'Description' },
          { label: dto.description ?? '' },
        ],
        [
          { label: 'Platform' },
          { label: dto.platform ?? ''},
        ],
        [
          { label: 'Type' },
          { label: dto.type ?? ''},
        ],
        [
          { label: 'Version' },
          { label: dto.version ?? ''},
        ],
        [
          { label: 'Report Type' },
          { label: dto.reportType ?? ''},
        ],
        [
          { label: 'Checks' },
          { label: `${dto.totalFailCount ?? 0} failed vs ${dto.totalPassCount ?? 0} passed`},
        ],
        [
          { label: 'Cron' },
          { label: '', cron: dto.cron ?? undefined},
        ],
        [
          { label: 'Updated' },
          { label: '', localTime: dto.updateTimestamp ?? undefined },
        ],
        [
          { label: 'Related Resources' },
          {
            label: 'on',
            url: {
              text: this.getHostname(dto.relatedResources?.[0] ?? '') ?? 'link',
              link: dto.relatedResources?.[0] ?? '',
            }
          },
        ],
      ]
    }
  }

  getHostname(urlString: string): string | undefined {
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch (error) {
      console.error("Invalid URL:", error);
      return undefined;
    }
  }
}
