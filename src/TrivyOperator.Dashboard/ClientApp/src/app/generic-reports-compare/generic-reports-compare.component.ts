import { Component, effect, input, model } from '@angular/core';

import { NamespaceImageSelectorComponent } from '../namespace-image-selector/namespace-image-selector.component';
import { NamespacedImageDto } from '../namespace-image-selector/namespace-image-selector.types';
import { TrivyReport, TrivyReportDetail } from '../abstracts/trivy-report'
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { MultiHeaderAction, TrivyTableColumn } from '../trivy-table/trivy-table.types';

type TrivyReportDetailComparedDto = TrivyReportDetail & {first?: boolean; second?: boolean};

@Component({
  selector: 'app-generic-reports-compare',
  imports: [ NamespaceImageSelectorComponent, TrivyTableComponent ],
  templateUrl: './generic-reports-compare.component.html',
  styleUrl: './generic-reports-compare.component.scss'
})
export class GenericReportsCompareComponent<
  TTrivyReportDto extends TrivyReport<TTrivyReportDetailDto>,
  TTrivyReportDetailDto extends TrivyReportDetail> {

  dataDtos = input.required<TTrivyReportDto[] | undefined>();
  comparedTableColumns = input.required<TrivyTableColumn[]>();
  namespacedImageDtos = input.required<NamespacedImageDto[] | undefined>();

  firstSelectedTrivyReportId = model<string | undefined>();
  secondSelectedTrivyReportId = model<string | undefined>();

  trivyReportDetailsCompared?: TrivyReportDetailComparedDto[];

  compareIsClearSelectionVisible = input<boolean | undefined>(false);
  compareIsCollapseAllVisible = input<boolean | undefined>(false);
  compareIsResetFiltersVisible = input<boolean | undefined>(false);
  compareIsExportCsvVisible = input<boolean | undefined>(false);
  compareIsRefreshVisible = input<boolean | undefined>(false);
  compareIsRefreshFilterable = input<boolean | undefined>(false);
  compareIsFooterVisible = input<boolean | undefined>(false);
  compareSelectionMode = input<'single' | 'multiple' | undefined>(undefined);
  compareStyle = input<{ [klass: string]: any } | undefined>({});
  compareStateKey = input<string | undefined>(undefined);
  compareDataKey = input<string | undefined>(undefined);
  compareRowExpansionRender = input<'messages' | 'table' | undefined>(undefined);
  compareExtraClasses = input<string | undefined>(undefined);
  compareMultiHeaderActions = input<MultiHeaderAction[]>([]);


  private _dataDtos?: TTrivyReportDto[];
  private _firstSelectedTrivyReportId?: string;
  private _secondSelectedTrivyReportId?: string;

  constructor() {
    effect(() => {
      this._firstSelectedTrivyReportId = this.firstSelectedTrivyReportId();
      this._secondSelectedTrivyReportId = this.secondSelectedTrivyReportId();
      this.compareSelectedTrivyReports();
    });
    effect(() => {
      this._dataDtos = this.dataDtos();
      this.compareSelectedTrivyReports();
    });
  }

  compareSelectedTrivyReports() {
    if (!this._dataDtos ||
      (!this._firstSelectedTrivyReportId && !this._secondSelectedTrivyReportId)
    ) {
      if (this.trivyReportDetailsCompared) {
        this.trivyReportDetailsCompared = undefined;
      }
      return;
    }

    if (!this._firstSelectedTrivyReportId && !this._secondSelectedTrivyReportId) {
      return;
    }

    const detailSet = new Map<string, TrivyReportDetailComparedDto>();

    this._dataDtos
      ?.find(tr => tr.uid === this._firstSelectedTrivyReportId)
      ?.details?.forEach(detail => {
      detailSet.set(detail.id ?? '', { ...detail, first: true });
    });

    this._dataDtos
      ?.find(tr => tr.uid === this._secondSelectedTrivyReportId)
      ?.details?.forEach(detail => {
      if (detailSet.has(detail.id ?? '')) {
        detailSet.get(detail.id ?? '')!.second = true; // mark right if already exists
      } else {
        detailSet.set(detail.id ?? '', { ...detail, second: true });
      }
    });
    detailSet.forEach(item => {
      if (this._firstSelectedTrivyReportId) {
        item.first = item.first ?? false;
      }
      if (this._secondSelectedTrivyReportId) {
        item.second = item.second ?? false;
      }
    });

    this.trivyReportDetailsCompared = Array.from(detailSet.values());
  }
}
