export interface TrivyReport<TTrivyReportDetail extends TrivyReportDetail> {
  uid?: string | null;
  details?: Array<TTrivyReportDetail> | null;
}

export interface TrivyReportDetail {
  id?: string | null;
}
