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
  ExportColumn, MultiHeaderAction,
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
import {SeverityNameByIdPipe} from "../pipes/severity-name-by-id.pipe";
import {SeverityNamesMaxDisplayPipe} from "../pipes/severity-names-max-display.pipe";

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
    SeverityNameByIdPipe,
    SeverityNamesMaxDisplayPipe,
  ],
  templateUrl: './trivy-table.component.html',
  styleUrl: './trivy-table.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrivyTableComponent<TData> implements OnInit {
  dataDtos = input<TData[] | null | undefined>([]);
  @Input() activeNamespaces?: string[] | null | undefined = [];

  @Input() csvStorageKey: string = 'default';
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

  selectedDataDtos?: any;
  @Input() set singleSelectDataDto(value: TData | undefined) {
    if (this.selectedDataDtos === value) {
      return;  // avoid (re)selection
    }
    this.selectedDataDtos = value;
    this.updateMultiHeaderActionSelectionChanged();
    if (value) {
      const index = this._dataDtos?.indexOf(value);
      if (index && this.trivyTable) {
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
    return this.dataDtos()?.length ?? 0;
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
      this.updateMultiHeaderActionOnDataChanged();
      this.newData();
    });
  }

  ngOnInit() {
    const savedCsvFileName = localStorage.getItem(LocalStorageUtils.csvFileNameKeyPrefix + this.csvStorageKey);
    if (savedCsvFileName) {
      this.csvFileName = savedCsvFileName;
    }
    this.tableStateKey = LocalStorageUtils.trivyTableKeyPrefix + this.trivyTableOptions.stateKey;
    this.filterSeverityOptions = this.severityDtos.map((x) => x.id);
    this.filterRefreshSeverities = [...this.severityDtos];

    this.multiHeaderActionInit();
  }

  public onTableClearSelected() {
    this.selectedDataDtos = undefined;
    this.updateMultiHeaderActionSelectionChanged();
  }

  public isTableRowSelected(): boolean {
    return this.selectedDataDtos ? this.selectedDataDtos.length > 0 : false;
  }

  onSelectionChange(event: any): void {
    this.updateMultiHeaderActionSelectionChanged();
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

  public onOverlayToggle() {
    this.overlayVisible = !this.overlayVisible;
  }




  onTrivyDetailsTableCallback(dto: TData) {
    this.trivyDetailsTableCallback.emit(dto);
  }

  onTableCollapseAll() {
    this.expandedRows = {};
    this.anyRowExpanded = false;
    this.updateMultiHeaderActionCollapsed();
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
    this.updateMultiHeaderActionCollapsed();
    // if (!this.windowResizeEventDispatched) {
    //   setTimeout(() => {
    //     window.dispatchEvent(new Event('resize'));
    //   }, 10);
    //   this.windowResizeEventDispatched = true;
    // }
  }

  onExportToCsv(exportType: string) {
    localStorage.setItem(LocalStorageUtils.csvFileNameKeyPrefix + this.csvStorageKey, this.csvFileName);
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
  // #endregion

  multiHeaderActionItems: (MenuItem & { initialData: MultiHeaderAction })[] = [];

  private multiHeaderActionInit() {
    if (this.trivyTableOptions.multiHeaderActions && (this.trivyTableOptions.multiHeaderActions?.length ?? 0) > 1) {
      this.multiHeaderActionItems = this.trivyTableOptions.multiHeaderActions.slice(1).map(actionItem => ({
        label: actionItem.specialAction ?? actionItem.label,
        command: this.multiHeaderActionGetCommand(actionItem),
        icon: this.multiHeaderActionGetIcon(actionItem),
        disabled: this.isMultiHeaderActionDisabled(actionItem),
        initialData: actionItem,
      }));
    }
  }

  protected multiHeaderActionGetCommand(actionItem: MultiHeaderAction): () => void {
    if (actionItem.specialAction) {
      switch (actionItem.specialAction) {
        case "Go to Detailed \u29C9" :
          return () => this.multiHeaderActionRequested.emit("goToDetailedPage");
        case "Clear Selection":
          return () => this.onTableClearSelected();
        case "Clear Sort/Filters":
          return () => this.onClearSortFilters();
        case "Collapse All":
          return () => this.onTableCollapseAll();
        default:
          console.error(actionItem);
      }
    }
    return () => this.multiHeaderActionRequested.emit(actionItem.label);
  }

  private multiHeaderActionGetIcon(actionItem: MultiHeaderAction): string {
    if (actionItem.specialAction) {
      switch (actionItem.specialAction) {
        case "Go to Detailed \u29C9" :
          return 'pi pi-align-justify';
        case "Clear Selection":
          return 'pi pi-list';
        case "Clear Sort/Filters":
          return 'pi pi-filter';
        case "Collapse All":
          return 'pi pi-expand';
        default:
          console.error(actionItem);
      }
    }
    return actionItem.icon ?? '';
  }

  isMultiHeaderActionDisabled(actionItem: MultiHeaderAction): boolean {
    if (actionItem.enabledIfDataLoaded)
    {
      return (this._dataDtos.length ?? 0) === 0;
    }
    if (actionItem.enabledIfRowSelected || actionItem.specialAction == 'Clear Selection')
    {
      return this.trivyTableSelectedRecords === 0;
    }
    if (actionItem.specialAction == 'Clear Sort/Filters')
    {
      return !this.isTableFilteredOrSorted();
    }
    if (actionItem.specialAction == 'Collapse All') {
      return !this.anyRowExpanded;
    }

    return false;
  }

  private updateMultiHeaderActionOnDataChanged() {
    this.multiHeaderActionItems
      .filter(actionItem => actionItem.initialData.enabledIfDataLoaded)
      .forEach(actionItem => {
        actionItem.disabled = (this._dataDtos.length ?? 0) === 0;
      });
  }

  private updateMultiHeaderActionClearSortFilters() {
    const menuItem = this.multiHeaderActionItems
      .find(x => x.initialData.specialAction == "Clear Sort/Filters");
    if (menuItem) {
      menuItem.disabled = !this.isTableFilteredOrSorted();
    }
  }

  private updateMultiHeaderActionSelectionChanged() {
    this.multiHeaderActionItems
      .filter(actionItem => actionItem.initialData.enabledIfRowSelected)
      .forEach(actionItem => {
        actionItem.disabled = this.trivyTableSelectedRecords === 0;
      });
    const menuItem = this.multiHeaderActionItems
      .find(x => x.initialData.specialAction == "Clear Selection");
    if (menuItem) {
      menuItem.disabled = this.trivyTableSelectedRecords === 0;
    }
  }

  private updateMultiHeaderActionCollapsed() {
    const menuItem = this.multiHeaderActionItems
      .find(x => x.initialData.specialAction == "Collapse All");
    if (menuItem) {
      menuItem.disabled = !this.anyRowExpanded;
    }
  }


  onSort() {
    this.updateMultiHeaderActionClearSortFilters();
  }

  onFilter() {
    this.updateMultiHeaderActionClearSortFilters();
  }

  public isTableFilteredOrSorted(): boolean {
    if (!this.trivyTable || this.isLoading) {
      return false;
    }
    return (
        (!!this.trivyTable.filteredValue) ||
        (this.trivyTable.multiSortMeta == null ? false : this.trivyTable.multiSortMeta.length > 0)
    );
  }

  public onClearSortFilters() {
    const currentFilters = JSON.parse(JSON.stringify(this.trivyTable.filters));
    PrimengTableStateUtil.clearFilters(this.trivyTable.filters);
    this.trivyTable.clear();
    this.filterSelectedActiveNamespaces = [];
    this.filterSelectedSeverityIds = [];
    this.updateMultiHeaderActionClearSortFilters();
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
    this.updateMultiHeaderActionClearSortFilters();
  }

  // public onClearFilters() {
  //   PrimengTableStateUtil.clearFilters(this.trivyTable.filters);
  //   this.trivyTable.clearFilterValues();
  //   this.filterSelectedActiveNamespaces = [];
  //   this.filterSelectedSeverityIds = [];
  //   this.clearLocalStorageSavedLayout('filter');
  // }
  //
  // public onClearSorting() {
  //   this.trivyTable.multiSortMeta = [];
  //   this.trivyTable.sort();
  //   this.clearLocalStorageSavedLayout('filter');
  // }
  //
  // private isTableFiltered(): boolean {
  //   return !!this.trivyTable.filteredValue;
  // }
  // private isTableSorted(): boolean {
  //   return this.trivyTable?.multiSortMeta == null ? false : this.trivyTable.multiSortMeta.length > 0;
  // }
  // private clearLocalStorageSavedLayout(item: 'sort' | 'filter') {
  //   if (this.trivyTableOptions.stateKey) {
  //     const tableState = localStorage.getItem(this.trivyTableOptions.stateKey);
  //     if (!tableState) {
  //       return;
  //     }
  //     const tableStateJson = JSON.parse(tableState);
  //     if (item === 'sort') {
  //       PrimengTableStateUtil.clearTableMultiSort(tableStateJson);
  //     }
  //     else {
  //       PrimengTableStateUtil.clearTableFilters(tableStateJson);
  //     }
  //     localStorage.setItem(this.trivyTableOptions.stateKey, JSON.stringify(tableStateJson));
  //   }
  // }

  newData() {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
  }
  // #endregion

  // temp fix for https://github.com/primefaces/primeng/issues/16576
  hasActiveFilter (columnKey: string): string {
    if (!this.trivyTable) {
      return '';
    }
    if (Object.hasOwn(this.trivyTable.filters, columnKey)) {
      let filter = this.trivyTable.filters[columnKey]
      if (!Array.isArray(filter)) {
        filter = [filter]
      }
      if (filter[0].value && filter[0].value !== 0) {
        return 'tod-active-filter'
      }
    }
    return ''
  }
}

// clear filters on reset table: https://stackoverflow.com/questions/51395624/reset-filter-value-on-primeng-table
