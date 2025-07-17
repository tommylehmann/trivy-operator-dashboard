import { Component, effect, input, model, OnInit } from '@angular/core';

import { SbomReportImageDto } from '../../api/models/sbom-report-image-dto';
import { SbomReportService } from '../../api/services/sbom-report.service';

import { GenericReportsCompareComponent } from '../ui-elements/generic-reports-compare/generic-reports-compare.component';
import { NamespacedImageDto } from '../ui-elements/namespace-image-selector/namespace-image-selector.types';

import { TrivyTableColumn } from '../ui-elements/trivy-table/trivy-table.types';

@Component({
  selector: 'app-sbom-reports-compare',
  imports: [ GenericReportsCompareComponent ],
  templateUrl: './sbom-reports-compare.component.html',
  styleUrl: './sbom-reports-compare.component.scss'
})
export class SbomReportsCompareComponent implements OnInit {
  dataDtos = model<SbomReportImageDto[] | undefined>();
  firstSelectedSbomReportId = input<string | undefined>();
  namespacedImageDtos?: NamespacedImageDto[];

  comparedTableColumns: TrivyTableColumn[] = [
    {
      field: 'first',
      header: '1st',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 90px; max-width: 90px;',
      renderType: 'boolean',
    },
    {
      field: 'second',
      header: '2nd',
      isFilterable: false,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 90px; max-width: 90px;',
      renderType: 'boolean',
    },
    {
      field: 'name',
      header: 'Name',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'white-space: nowrap; text-overflow: ellipsis; overflow: hidden; width: 290px;',
      renderType: 'standard',
    },
    {
      field: 'version',
      header: 'Version',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 130px; max-width: 130px;',
      renderType: 'standard',
    },
    {
      field: 'purl',
      header: 'purl',
      isFilterable: true,
      isSortable: true,
      multiSelectType: 'none',
      style: 'width: 440px; max-width: 440px;',
      renderType: 'standard',
    },
  ];

  constructor(private service: SbomReportService) {
    effect(() => {
      const dataDtos = this.dataDtos();
      if (dataDtos) {
        this.onGetDataDtos(dataDtos);
      }
    });
  }

  ngOnInit() {
    if (!this.dataDtos()) {
      this.service
        .getSbomReportImageDtos()
        .subscribe({
          next: (res) => this.onGetDataDtos(res),
          error: (err) => console.error(err),
        });
    }
  }

  onGetDataDtos(sbomReportImageDtos: SbomReportImageDto[]) {
    this.dataDtos.set(sbomReportImageDtos);
    this.namespacedImageDtos = sbomReportImageDtos
      .map(sbom => ({
        uid: sbom.uid ?? '', resourceNamespace: sbom.resourceNamespace ?? '',
        imageName: sbom.imageName ?? '', imageTag: sbom.imageTag ?? '' }));
  }
}
