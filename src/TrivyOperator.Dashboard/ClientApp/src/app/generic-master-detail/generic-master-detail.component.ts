import {
  Component,
  effect,
  EventEmitter,
  HostListener,
  input,
  Input,
  output,
  Output,
  signal,
  ViewChild,
} from '@angular/core';

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
  activeNamespaces = input<string[] | undefined>([]);
  mainTableColumns = input.required<TrivyTableColumn[]>();
  mainTableOptions = input.required<TrivyTableOptions>();
  isMainTableLoading = input<boolean>(true);
  detailsTableColumns = input.required<TrivyTableColumn[]>();
  detailsTableOptions = input.required<TrivyTableOptions>();
  singleSelectDataDto = input<TDataDto | undefined>();
  splitterStorageKey = input<string | undefined>();

  refreshRequested = output<TrivyFilterData>();
  mainTableExpandCallback = output<TDataDto>();
  mainTableMultiHeaderActionRequested = output<string>();
  detailsTableMultiHeaderActionRequested = output<string>();
  mainTableSelectedRowChanged = output<TDataDto | null>();

  @Input() mainTableExpandTableOptions: TrivyExpandTableOptions<TDataDto> = new TrivyExpandTableOptions(false, 0, 0);

  @ViewChild('mainTable', { static: true }) mainTable?: TrivyTableComponent<TDataDto>;

  dataDtos = input<TDataDto[]>([]);
  selectedDataDto: TDataDto | null = null;

  screenSize: string = this.getScreenSize();

  protected _dataDtos: TDataDto[] = [];
  protected _isMainTableLoading: boolean = this.isMainTableLoading();

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
    effect(() => {
      this._dataDtos = this.dataDtos();
      this.onGetTDataDtos();
    });

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

  // screen size
  @HostListener('window:resize', [])
  onResize() {
    this.screenSize = this.getScreenSize();
  }

  getScreenSize(): string {
    const cssVarValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--tod-screen-width-xs')
      .trim(); // Get and clean the CSS variable value

    const threshold = parseInt(cssVarValue, 10); // Convert it to a number

    return window.innerWidth < threshold ? 'sm' : 'lg';
  }
}
