export interface TrivyTableOptions {
  isClearSelectionVisible: boolean;
  isResetFiltersVisible: boolean;
  isExportCsvVisible: boolean;
  isRefreshVisible: boolean;
  isRefreshFiltrable: boolean;
  isFooterVisible: boolean;
  tableSelectionMode: null | 'single' | 'multiple';
  tableStyle: { [klass: string]: any };
  stateKey: string | null;
  dataKey: string | null;
  rowExpansionRender: null | 'table' | 'messages';
  extraClasses: string;
}

export interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

export interface ExportColumn {
  title: string;
  dataKey: string;
}

export interface TrivyTableColumn extends Column {
  isSortable: boolean;
  isSortIconVisible?: boolean;
  isFiltrable: boolean;
  style: string;
  multiSelectType: 'none' | 'namespaces' | 'severities';
  renderType:
    | 'standard'
    | 'severityBadge'
    | 'severityMultiTags'
    | 'severityValue'
    | 'imageNameTag'
    | 'link'
    | 'date'
    | 'dateTime'
    | 'eosl'
    | 'semaphore'
    | 'multiline';
  extraFields?: string[];
}

export interface TrivyFilterData {
  namespaceName?: string | null;
  selectedSeverityIds: number[];
}

export class TrivyExpandTableOptions<TData> {
  isHeaderVisible: boolean = true;
  columnsNo: number = 0;
  rowsNo: number = 0;
  private fn: ((data: TData) => number) | undefined;

  constructor(isHeaderVisible: boolean, columnsNo: number, rowsNo: number, fn?: (data: TData) => number) {
    this.isHeaderVisible = isHeaderVisible;
    this.columnsNo = columnsNo;
    this.rowsNo = rowsNo;
    this.fn = fn;

    this._rowsArray = this.getRowsArrayByRowsNo(rowsNo);
  }

  getRowsArray(data: TData): number[] {
    console.log("mama");
    if (this.fn) {
      return this.getRowsArrayByRowsNo(this.fn(data));
    }
    return this._rowsArray;
  }

  getRowsNo(data: TData): number {
    if (this.fn) {
      return this.fn(data);
    }
    return this.rowsNo;
  }

  get columnsArray(): number[] {
    return Array(this.columnsNo)
      .fill(0)
      .map((_, i) => i);
  }
    // or return Array.from({ length: this.columnsNo }, (_, i) => i);

  private getRowsArrayByRowsNo(rowsNo: number): number[] {
    console.log("TrivyExpandTableOptions - " + rowsNo);
    if (this.rowsNo > 0) {
      return Array(rowsNo)
        .fill(0)
        .map((_, i) => i);
    }
    return [];
  }

  private _rowsArray: number[] = [];
}

export interface TrivyTableCellCustomOptions {
  value: string;
  style: string;
  buttonLink: string | undefined;
  badge: string | undefined;
  url: string | undefined;
}
