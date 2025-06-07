import { Component, effect, input, model } from '@angular/core';

import { NamespaceImageSelectorComponent } from '../namespace-image-selector/namespace-image-selector.component';
import { NamespacedImageDto } from '../namespace-image-selector/namespace-image-selector.types';
import { TrivyReport, TrivyReportDetail } from '../abstracts/trivy-report'
import { TrivyTableComponent } from '../trivy-table/trivy-table.component';
import { TrivyTableColumn, TrivyTableOptions } from '../trivy-table/trivy-table.types';

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
  compareTableOptions = input.required<TrivyTableOptions>();
  namespacedImageDtos = input.required<NamespacedImageDto[] | undefined>();

  firstSelectedTrivyReportId = model<string | undefined>();
  secondSelectedTrivyReportId = model<string | undefined>();

  trivyReportDetailsCompared?: TrivyReportDetailComparedDto[];

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
