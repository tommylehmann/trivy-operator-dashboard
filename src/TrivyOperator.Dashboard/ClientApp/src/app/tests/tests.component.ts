import { Component, effect, HostListener, input, OnInit } from '@angular/core';

import { FcoseComponent } from '../fcose/fcose.component';
import { NodeDataDto } from '../fcose/fcose.types';

import { TrivyReportDependencyService } from '../../api/services/trivy-report-dependency.service';
import { TrivyReportDependencyDto } from '../../api/models/trivy-report-dependency-dto';

import { SplitterModule } from 'primeng/splitter';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode, TreeTableNode } from 'primeng/api';
import {NgIf, NgSwitchCase} from '@angular/common';
import { SeverityCssStyleByIdPipe } from '../pipes/severity-css-style-by-id.pipe';
import { VulnerabilityCountPipe } from '../pipes/vulnerability-count.pipe';
import {TrivyReportDependencyDetailDto} from "../../api/models/trivy-report-dependency-detail-dto";

export interface ReportTreeNode extends TreeNode {
  data: {
    id: string;
    objectType: string;
    description: string;
    hasSeverities: boolean;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
}



@Component({
  selector: 'app-tests',
  imports: [FcoseComponent, SplitterModule, TagModule, TreeTableModule, NgSwitchCase, SeverityCssStyleByIdPipe, VulnerabilityCountPipe, NgIf],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.scss'
})
export class TestsComponent implements OnInit {
  nodeDataDtos: NodeDataDto[] = [];

  extraColorClasses: {name: string, code: string}[] = [
    { name: 'buttermilk',     code: '#FFF2B2' },
    { name: 'sunbeam-yellow', code: '#F7C948' },
    { name: 'amber-glow',     code: '#E8B04B' },
    { name: 'harvest-orange', code: '#F4A261' },
    { name: 'spiced-apricot', code: '#D88B4A' },
    { name: 'burnt-sienna',   code: '#B25C33' }
  ];

  trivyReportDependencyDto = input<TrivyReportDependencyDto | undefined>();
  protected _trivyReportDependencyDto?: TrivyReportDependencyDto;

  screenSize: string = this.getScreenSize();

  treeNodes: ReportTreeNode[] = [];
  selectedTreeNode?: ReportTreeNode;
  selectedNodeId?: string;

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
      this.treeNodes = [];
      return;
    }


    this.getTreeNodes(res);
    this.getFcoseNodes(res);
  }

  private getTreeNodes(res: TrivyReportDependencyDto): void {
    const tree: ReportTreeNode[] = [];

    if (res.image) {
      const imageKey = res.image.id || res.image.imageDigest || 'image-root';

      const imageNode: ReportTreeNode = {
        key: imageKey,
        data: {
          id: res.image.id ?? '',
          objectType: 'Image',
          description: `${res.image.imageRepository ?? ''}/${res.image.imageName ?? ''}:${res.image.imageTag ?? ''}`,
          hasSeverities: false,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0
        },
        expanded: true,
        children: []
      };

      res.kubernetesDependencies?.forEach((dep, depIndex) => {
        if (dep.kubernetesResource) {
          const resourceKey = dep.kubernetesResource.id ?? `${imageKey}-resource-${depIndex}`;

          const resourceNode: ReportTreeNode = {
            key: resourceKey,
            data: {
              id: dep.kubernetesResource.id ?? '',
              objectType: `${dep.kubernetesResource.resourceKind ?? 'K8s Resource'}`,
              description: `${dep.kubernetesResource.resourceName ?? ''}`,
              hasSeverities: false,
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              unknown: 0
            },
            expanded: true,
            children: []
          };

          dep.trivyReportDependencies?.forEach((detail, detailIndex) => {
            const detailKey = detail.uid ?? `${resourceKey}-detail-${detailIndex}`;

            resourceNode.children!.push({
              key: detailKey,
              data: {
                id: detail.uid ?? '',
                objectType: detail.trivyReport || 'unknown',
                description: '',
                hasSeverities: detail.trivyReport !== 'Sbom',
                critical: detail.criticalCount ?? 0,
                high: detail.highCount ?? 0,
                medium: detail.mediumCount ?? 0,
                low: detail.lowCount ?? 0,
                unknown: detail.unknownCount ?? 0
              },
              expanded: true
            });
          });

          imageNode.children!.push(resourceNode);
        }
      });

      tree.push(imageNode);
    }

    this.treeNodes = tree;
  }

  private getFcoseNodes(res: TrivyReportDependencyDto){
    if (!res.image) {
      this.nodeDataDtos = [{ id: 'undefined', name: 'undefined', isMain: true}]
      return;
    }

    const rootNodeDepIds: string[] = [];
    this.nodeDataDtos.push({id: res.image.id, name: `${res.image.imageName ?? 'n/a'}`, isMain: true, dependsOn: rootNodeDepIds, colorClass: 'sunbeam-yellow', });

    (res.kubernetesDependencies ?? []).forEach((dependency) => {
      rootNodeDepIds.push(dependency.kubernetesResource?.id ?? 'n/a');

      const trivyRepIds: string[] = [];
      this.nodeDataDtos.push({id: dependency.kubernetesResource?.id, name: dependency.kubernetesResource?.resourceName, isMain: false, dependsOn: trivyRepIds, colorClass: 'buttermilk', });
      (dependency.trivyReportDependencies ?? []).forEach((trivyRep) => {
        trivyRepIds.push(trivyRep.uid ?? 'n/a');
        this.nodeDataDtos.push({id: trivyRep.uid ?? 'n/a', name: this.getTrivyRepLabel(trivyRep), colorClass: 'spiced-apricot'}, );
      })
    });
  }

  private getTrivyRepLabel(trivyRep: TrivyReportDependencyDetailDto) {
    switch (trivyRep.trivyReport?.toLowerCase()) {
      case "configaudit":
      case "exposedsecret":
        return `${trivyRep.trivyReport} - ${trivyRep.criticalCount ?? 0} / ${trivyRep.highCount ?? 0} / ${trivyRep.mediumCount ?? 0} / ${trivyRep.lowCount ?? 0}`;
      case "vulnerability":
        return `${trivyRep.trivyReport} - ${trivyRep.criticalCount ?? 0} / ${trivyRep.highCount ?? 0} / ${trivyRep.mediumCount ?? 0} / ${trivyRep.lowCount ?? 0} / ${trivyRep.unknownCount ?? 0}`;
      default:
        return `${trivyRep.trivyReport}`;
    }
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
          return "aqua";
      }
  }

  // node change

  onGraphSelectedNodeIdChange(event: string | undefined) {
    const currentSelectedTreeNodeId = this.selectedTreeNode?.data.id;
    if (event !== currentSelectedTreeNodeId) {
      if (!event) {
        this.selectedTreeNode = undefined;
        return;
      }
      this.selectedTreeNode = this.findTreeNodeById(this.treeNodes, event);
    }
  }

  onTreeTableNodeSelect(event: TreeTableNode<ReportTreeNode['data']>) {
    this.selectedNodeId = event.node?.data?.id;
  }

  onTreeTableNodeUnselect() {
    this.selectedNodeId = undefined;
  }

  findTreeNodeById(nodes: ReportTreeNode[], nodeId: string): ReportTreeNode | undefined {
    for (const node of nodes) {
      if (node.data.id === nodeId) {
        return node;
      }

      if (node.children && node.children.length > 0) {
        const found = this.findTreeNodeById(node.children as ReportTreeNode[], nodeId);
        if (found) return found;
      }
    }

    return undefined;
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
