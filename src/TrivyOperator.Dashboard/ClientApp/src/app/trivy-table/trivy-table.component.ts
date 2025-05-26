import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  input,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Popover, PopoverModule } from 'primeng/popover';
import { Select, SelectModule } from 'primeng/select';
import { SplitButton, SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule, TableRowSelectEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { SeverityDto } from '../../api/models/severity-dto';
import { LocalStorageUtils } from '../utils/local-storage.utils';
import { PrimengTableStateUtil } from '../utils/primeng-table-state.util';
import { SeverityUtils } from '../utils/severity.utils';
import {
  ExportColumn,
  TrivyExpandTableOptions,
  TrivyFilterData,
  TrivyTableCellCustomOptions,
  TrivyTableColumn,
  TrivyTableOptions,
} from './trivy-table.types';

import { CellRowArrayPipe } from '../pipes/cell-row-array.pipe';
import { VulnerabilityCountPipe } from '../pipes/vulnerability-count.pipe';
import { BooleanCssStylePipe } from '../pipes/boolean-css-style.pipe';
import { CapitalizeFirstPipe } from '../pipes/capitalize-first.pipe';
import { SeverityCssStyleByIdPipe } from '../pipes/severity-css-style-by-id.pipe';
import { SemaphoreCssStyleByNamePipe } from '../pipes/semaphore-css-style-by-name.pipe';
import { CronPipe } from '../pipes/cron.pipe';
import { LocalTimePipe } from '../pipes/local-time.pipe';

import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-trivy-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    MultiSelectModule,
    PopoverModule,
    Select,
    SplitButtonModule,
    TableModule,
    TagModule,
    CellRowArrayPipe,
    VulnerabilityCountPipe,
    BooleanCssStylePipe,
    CapitalizeFirstPipe,
    SeverityCssStyleByIdPipe,
    SemaphoreCssStyleByNamePipe,
    CronPipe,
    LocalTimePipe,
  ],
  templateUrl: './trivy-table.component.html',
  styleUrl: './trivy-table.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrivyTableComponent<TData> implements OnInit {
  dataDtos = input<TData[] | null | undefined>([]);
  @Input() activeNamespaces?: string[] | null | undefined = [];

  @Input() csvStoragekey: string = 'default';
  @Input() csvFileName: string = 'Default.csv.FileName';

  @Input() exportColumns: ExportColumn[] = [];
  @ViewChild('trivyTable') trivyTable!: Table;
  @ViewChild('serverFilterDataOp') serverFilterDataOp?: Popover;
  @ViewChild('csvExportOp') csvExportOp?: Popover;
  @ViewChild('refreshSplitButton') refreshSplitButton?: SplitButton;
  @ViewChild('filterNamespacesSelect') filterNamespacesSelect?: Select;

  @Input() public tableHeight: string = '10vh';
  @Input() public isLoading: boolean = false;

  @Input() trivyTableColumns: TrivyTableColumn[] = [];
  @Input({ required: true }) trivyTableOptions!: TrivyTableOptions;

  @Input() trivyExpandTableOptions: TrivyExpandTableOptions<TData> = new TrivyExpandTableOptions(false, 0, 0);
  @Output() trivyDetailsTableCallback = new EventEmitter<TData>();
  @Output() selectedRowsChanged = new EventEmitter<TData[]>();
  @Output() refreshRequested = new EventEmitter<TrivyFilterData>();
  @Output() rowActionRequested = new EventEmitter<TData>();
  @Output() multiHeaderActionRequested = new EventEmitter<string>();
  tableStateKey: string | undefined = undefined;

  selectedDataDtos?: any | null = null;
  @Input() set singleSelectDataDto(value: TData | undefined) {
    if (this.selectedDataDtos == value) {
      return;  // avoid (re)selection
    }
    this.selectedDataDtos = value;
    if (value) {
      const index = this._dataDtos?.indexOf(value);
      if (index) {
        this.trivyTable.scrollToVirtualIndex(index);
      }
      this.selectedRowsChanged.emit([value]);
    }

  }
  public filterSeverityOptions: number[] = [];
  public filterSelectedSeverityIds: number[] | null = [];
  public filterSelectedActiveNamespaces: string[] | null = [];
  public filterRefreshActiveNamespace: string | null = '';
  public filterRefreshSeverities: SeverityDto[] | undefined;
  public isTableVisible: boolean = true;
  public severityDtos: SeverityDto[] = [...SeverityUtils.severityDtos];
  // custom back overlay
  public overlayVisible: boolean = false;
  //rows expand
  expandedRows = {};
  anyRowExpanded: boolean = false;

  private isSelectionChangedExternally: boolean = false;
  private windowResizeEventDispatched: boolean = false;

  protected _dataDtos: TData[] = [];

  public get trivyTableTotalRecords(): number {
    return this.dataDtos ? this.dataDtos.length : 0;
  }

  public get trivyTableSelectedRecords(): number {
    if (this.trivyTableOptions?.tableSelectionMode === 'single') {
      return this.selectedDataDtos ? 1 : 0;
    } else {
      return this.selectedDataDtos ? this.selectedDataDtos.length : 0;
    }
  }

  public get trivyTableFilteredRecords(): number {
    return this.trivyTable?.filteredValue ? this.trivyTable.filteredValue.length : this.trivyTableTotalRecords;
  }

  @Input() trivyExpandTableFunction: (
    dto: TData,
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
      this._dataDtos = this.dataDtos() ?? [];
      this.newData();

    });
  }

  ngOnInit() {
    const savedCsvFileName = localStorage.getItem(LocalStorageUtils.csvFileNameKeyPrefix + this.csvStoragekey);
    if (savedCsvFileName) {
      this.csvFileName = savedCsvFileName;
    }
    this.tableStateKey = LocalStorageUtils.trivyTableKeyPrefix + this.trivyTableOptions.stateKey;
    this.filterSeverityOptions = this.severityDtos.map((x) => x.id);
    this.filterRefreshSeverities = [...this.severityDtos];

    if (this.trivyTableOptions?.multiHeaderAction && this.trivyTableOptions.multiHeaderAction.length > 1) {
      for (let i = 1; i < this.trivyTableOptions.multiHeaderAction.length; i++) {
        const actionLabel = this.trivyTableOptions.multiHeaderAction[i];
        this.multiHeaderActionItems.push({
          label: actionLabel,
          command: () => { this.onMultiHeaderAction(actionLabel); }
        });
      }
    }
  }

  public onTableClearSelected() {
    this.selectedDataDtos = null;
  }

  public isTableRowSelected(): boolean {
    return this.selectedDataDtos ? this.selectedDataDtos.length > 0 : false;
  }

  onSelectionChange(event: any): void {
    if (!event) {
      this.selectedRowsChanged.emit([]);
      return;
    }
    if (this.trivyTableOptions.tableSelectionMode === 'single') {
      this.selectedRowsChanged.emit([event]);
    } else {
      this.selectedRowsChanged.emit(event);
    }
  }

  onFilterRefresh(_event: MouseEvent) {
    this.onFilterData();
  }

  onFilterDropdownClick(_event: Event) {
    if (this.refreshSplitButton?.menu) {
      setTimeout(() => {
        this.refreshSplitButton?.menu?.hide();
      }, 0);
    }
    this.serverFilterDataOp?.toggle(_event);
  }

  onFilterData() {
    const event: TrivyFilterData = {
      namespaceName: this.filterRefreshActiveNamespace,
      selectedSeverityIds: this.filterRefreshSeverities?.map((x) => x.id) ?? [],
    };
    this.serverFilterDataOp?.hide();
    this.refreshRequested.emit(event);
  }

  onFilterReset() {
    this.filterRefreshSeverities = [...this.severityDtos];
    if (this.filterNamespacesSelect) {
      this.filterNamespacesSelect.clear();
    }
  }

  // there is an NG0100 error from here

  public onOverlayToogle() {
    this.overlayVisible = !this.overlayVisible;
  }

  public isTableFilteredOrSorted(): boolean {
    if (!this.trivyTable || this.isLoading) {
      return false;
    }
    return (
      (this.trivyTable.filteredValue ? true : false) ||
      (this.trivyTable.multiSortMeta == null ? false : this.trivyTable.multiSortMeta.length > 0)
    );
  }

  public onClearSortFilters() {
    const currentFilters = JSON.parse(JSON.stringify(this.trivyTable.filters));
    PrimengTableStateUtil.clearFilters(this.trivyTable.filters);
    this.trivyTable.clear();
    this.filterSelectedActiveNamespaces = [];
    this.filterSelectedSeverityIds = [];
    if (this.trivyTableOptions.stateKey) {
      const tableState = localStorage.getItem(this.trivyTableOptions.stateKey);
      if (!tableState) {
        return;
      }
      const tableStateJson = JSON.parse(tableState);
      PrimengTableStateUtil.clearTableFilters(tableStateJson);
      PrimengTableStateUtil.clearTableMultiSort(tableStateJson);
      localStorage.setItem(this.trivyTableOptions.stateKey, JSON.stringify(tableStateJson));
    }
  }

  onTrivyDetailsTableCallback(dto: TData) {
    this.trivyDetailsTableCallback.emit(dto);
  }

  onTableCollapseAll() {
    this.expandedRows = {};
    this.anyRowExpanded = false;
    if (this.trivyTableOptions.stateKey) {
      const tableState = localStorage.getItem(this.trivyTableOptions.stateKey);
      if (!tableState) {
        return;
      }

      const tableStateJson = JSON.parse(tableState);
      if (tableStateJson.hasOwnProperty('expandedRowKeys')) {
        delete tableStateJson.expandedRowKeys;
      }
      localStorage.setItem(this.trivyTableOptions.stateKey, JSON.stringify(tableStateJson));
    }
  }

  onRowExpandCollapse(_event: any) {
    this.anyRowExpanded = JSON.stringify(this.expandedRows) != '{}';
    // if (!this.windowResizeEventDispatched) {
    //   setTimeout(() => {
    //     window.dispatchEvent(new Event('resize'));
    //   }, 10);
    //   this.windowResizeEventDispatched = true;
    // }
  }

  onExportToCsv(exportType: string) {
    localStorage.setItem(LocalStorageUtils.csvFileNameKeyPrefix + this.csvStoragekey, this.csvFileName);
    switch (exportType) {
      case 'all':
        this.trivyTable.exportCSV({ allValues: true });
        break;
      case 'filtered':
        this.trivyTable.exportCSV();
        break;
    }
    if (this.csvExportOp) {
      this.csvExportOp.hide();
    }
  }

  getExtraClasses() {
    return this.trivyTableOptions.extraClasses;
  }

  public onTableStateSave() {
    if (!this.trivyTableOptions.tableSelectionMode) {
      return;
    }
    if (!this.tableStateKey) {
      return;
    }
    const tableStateJson = localStorage.getItem(this.tableStateKey);
    if (!tableStateJson) {
      return;
    }
    const tableState = JSON.parse(tableStateJson);
    PrimengTableStateUtil.clearTableSelection(tableState);
    PrimengTableStateUtil.clearTableExpandedRows(tableState);
    localStorage.setItem(this.tableStateKey, JSON.stringify(tableState));
  }

  severityWrapperGetNames(severityIds: number[], maxDisplay?: number | undefined): string {
    return SeverityUtils.getNames(severityIds, maxDisplay);
  }

  severityWrapperGetName(severityId: number): string {
    return SeverityUtils.getName(severityId);
  }

  severityWrapperGetCapitalizedName(severityId: number): string {
    return SeverityUtils.getCapitalizedName(severityId);
  }

  severityWrapperGetCssColor(severityId: number): string {
    return SeverityUtils.getCssColor(severityId);
  }

  severityWrapperGetCssColorByName(severityName: string): string {
    return SeverityUtils.getCssColorByName(severityName);
  }

  formatUtcToLocal(utcDateString: string): string {
    const date = new Date(utcDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // #region to be moved appropriately
  private _rowArray: number[] = [];
  getExpandCellRowArray(data: TData): number[] {
    if (this._rowArray.length == this.trivyExpandTableOptions.getRowsNo(data)) {
      return this._rowArray;
    }
    this._rowArray = this.trivyExpandTableOptions.getRowsArray(data);
    return this._rowArray;
  }

  onRowAction(event: TData) {
    this.rowActionRequested.emit(event);
  }

  onMultiHeaderAction(actionLabel: string) {
    this.multiHeaderActionRequested.emit(actionLabel);
  }
  multiHeaderActionItems: MenuItem[] = [];

  newData() {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
  }
  // #endregion


}

// clear filters on reset table: https://stackoverflow.com/questions/51395624/reset-filter-value-on-primeng-table
