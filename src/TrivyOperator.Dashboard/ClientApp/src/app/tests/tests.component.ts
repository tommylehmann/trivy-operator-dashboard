import { Component, effect, input, OnInit } from '@angular/core';

import { FcoseComponent } from '../fcose/fcose.component';
import { NodeDataDto } from '../fcose/fcose.types';

import { TrivyReportDependencyService } from '../../api/services/trivy-report-dependency.service';
import { TrivyReportDependencyDto } from '../../api/models/trivy-report-dependency-dto';

@Component({
  selector: 'app-tests',
  imports: [FcoseComponent],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.scss'
})
export class TestsComponent implements OnInit {
  nodeDataDtos: NodeDataDto[] = [];

  extraColorClasses: {name: string, code: string}[] = [
    { name: 'teal', code: '#40B0A6' },
    { name: 'yellow', code: '#FFC20A' },
    { name: 'purple', code: '#5D3A9B' },
    { name: 'orange', code: '#E66100' },
    { name: 'turquoise', code: '#1A85FF' },
    { name: 'lime', code: '#B2DF8A' },
  ];

  trivyReportDependencyDto = input<TrivyReportDependencyDto | undefined>();
  protected _trivyReportDependencyDto?: TrivyReportDependencyDto;

  constructor(private service: TrivyReportDependencyService ) {
    effect(() => {
      this.onGetDataDto(this.trivyReportDependencyDto());
    });
  }

  ngOnInit() {
    this.service
      .getTrivyReportDependecyDtoByDigestNamespace({digest: "sha256:1be4ab8d95b478553ab8ba5bf46ffd9ad9788c8a2d373e1a63dc545e6f141fe1", namespaceName: "trivy"})
      .subscribe({
        next: (res) => this.onGetDataDto(res),
        error: (err) => console.error(err),
      });
  }

  onGetDataDto(res?: TrivyReportDependencyDto) {
    this._trivyReportDependencyDto = res;

    if (!res) {
      this.nodeDataDtos = [];
      return;
    }

    if (!res.image) {
      this.nodeDataDtos = [{ id: 'undefined', name: 'undefined', isMain: true}]
      return;
    }

    const rootNodeDepIds: string[] = [];
    this.nodeDataDtos.push({id: res.image.id, name: res.image.imageName ?? 'n/a', isMain: true, dependsOn: rootNodeDepIds, colorClass: 'teal', });

    (res.kubernetesDependencies ?? []).forEach((dependency) => {
      rootNodeDepIds.push(dependency.kubernetesResource?.id ?? 'n/a');

      const trivyRepIds: string[] = [];
      this.nodeDataDtos.push({id: dependency.kubernetesResource?.id, name: dependency.kubernetesResource?.resourceName, isMain: false, dependsOn: trivyRepIds, colorClass: 'yellow', });
      (dependency.trivyReportDependencies ?? []).forEach((trivyRep) => {
        trivyRepIds.push(trivyRep.uid ?? 'n/a');
        this.nodeDataDtos.push({id: trivyRep.uid ?? 'n/a', name: trivyRep.trivyReport, colorClass: this.getColorClass(trivyRep.trivyReport ?? '')}, );
      })
    });
  }

  private getColorClass(trivyReportName: string): string {
      switch (trivyReportName.toLowerCase()) {
        case "configaudit":
          return "purple";
        case "exposedsecret":
          return "orange";
        case "sbom":
          return "turquoise";
        case "vulnerability":
          return "lime";
        default:
          return "aqua"; // fallback to black
      }
  }
}
