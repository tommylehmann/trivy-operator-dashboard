import { Component, effect, EventEmitter, HostListener, input, Input, Output, signal, ViewChild } from '@angular/core';

import { SeverityDto } from '../../api/models/severity-dto';
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import {
  TrivyExpandTableOptions,
  TrivyFilterData,
  TrivyTableCellCustomOptions,
  TrivyTableColumn,
  TrivyTableOptions,
} from '../trivy-table/trivy-table.types';

import { SplitterModule } from 'primeng/splitter';

export interface IMasterDetail<TDetailDto> {
  details?: Array<TDetailDto> | null;
}

@Component({
  selector: 'app-generic-master-detail',
  standalone: true,
  imports: [TrivyTableComponent, SplitterModule],
  templateUrl: './generic-master-detail.component.html',
  styleUrl: './generic-master-detail.component.scss',
})
export class GenericMasterDetailComponent<TDataDto extends IMasterDetail<TDetailDto>, TDetailDto> {
  severityDtos= input<SeverityDto[]>([]);
  activeNamespaces = input<string[] | null>([]);
  mainTableColumns = input.required<TrivyTableColumn[]>();
  mainTableOptions = input.required<TrivyTableOptions>();
  @Input() mainTableExpandTableOptions: TrivyExpandTableOptions<TDataDto> = new TrivyExpandTableOptions(false, 0, 0);
  isMainTableLoading = input<boolean>(true);
  detailsTableColumns = input.required<TrivyTableColumn[]>();
  detailsTableOptions = input.required<TrivyTableOptions>();
  @Output() refreshRequested = new EventEmitter<TrivyFilterData>();
  @Output() mainTableExpandCallback = new EventEmitter<TDataDto>();
  @Output() mainTableMultiHeaderActionRequested = new EventEmitter<string>();
  @Output() detailsTableMultiHeaderActionRequested = new EventEmitter<string>();
  @Output() mainTableSelectedRowChanged = new EventEmitter<TDataDto | null>();
  @Input() singleSelectDataDto?: TDataDto;

  @ViewChild('mainTable', { static: true }) mainTable?: TrivyTableComponent<TDataDto>;

  selectedDataDto: TDataDto | null = null;

  private _dataDtos: TDataDto[] | null = [];
  protected _isMainTableLoading: boolean = this.isMainTableLoading();

  get dataDtos(): TDataDto[] | null {
    return this._dataDtos;
  }

  /*@Input() dataDtos: TDataDto[] = [];*/
  @Input() set dataDtos(dataDtos: TDataDto[]) {
    this._dataDtos = dataDtos;
    this.onGetTDataDtos();
  }

  @Input() public mainTableExpandCellOptions: (
    dto: TDataDto,
    type: 'header' | 'row',
    column: number,
    row?: number,
  ) => TrivyTableCellCustomOptions = (_dto, _type, _column, _row) => ({
    value: '',
    style: '',
    buttonLink: undefined,
    badge: undefined,
    url: undefined,
  });

  constructor() {
    effect(() => {
      this._isMainTableLoading = this.isMainTableLoading();
    })
  }

  onGetTDataDtos() {
    if (this.mainTable) {
      this.mainTable.onTableClearSelected();
    }
    this.selectedDataDto = null;
    this._isMainTableLoading = false;
  }

  onMainTableSelectionChange(event: TDataDto[]) {
    if (event == null || event.length == 0) {
      this.selectedDataDto = null;
      this.mainTableSelectedRowChanged.emit(null);
      return;
    } else {
      this.selectedDataDto = event[0];
      this.mainTableSelectedRowChanged.emit(event[0]);
    }
  }

  onRefreshRequested(event: TrivyFilterData) {
    this.refreshRequested.emit(event);
  }

  onMainTableExpandCallback(event: TDataDto) {
    this.mainTableExpandCallback.emit(event);
  }

  onMainTableMultiHeaderActionRequested(event: string) {
    this.mainTableMultiHeaderActionRequested.emit(event);
  }

  onDetailsTableMultiHeaderActionRequested(event: string) {
    this.detailsTableMultiHeaderActionRequested.emit(event);
  }

  screenSize: string = this.getScreenSize();

  @HostListener('window:resize', [])
  onResize() {
    this.screenSize = this.getScreenSize();
  }

  getScreenSize(): string {
    return window.innerWidth < 640 ? 'sm' : 'lg';
  }
}
