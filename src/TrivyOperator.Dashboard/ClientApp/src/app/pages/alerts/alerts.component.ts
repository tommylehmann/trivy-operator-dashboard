import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { AlertsService } from '../../services/alerts.service';
import { AlertDto } from '../../../api/models/alert-dto';
import { SeverityCssStyleByIdPipe } from '../../pipes/severity-css-style-by-id.pipe';
import { VulnerabilityCountPipe } from '../../pipes/vulnerability-count.pipe';
import { TrivyToolbarComponent } from '../../ui-elements/trivy-toolbar/trivy-toolbar.component';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TreeTableModule, TreeTableNodeCollapseEvent, TreeTableNodeExpandEvent } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { GenericObjectArraySummaryPipe } from '../../pipes/generic-object-array-summary.pipe';


interface AlertNodeData {
  key: string,
  level: number,
  label: string;
  message?: string;
  childrenLabels?: string,
  children: AlertNodeData[],
  statistics: {
    category: string,
    count: number;
  }[],
  count: number;
  severityId: number;
  isLeaf: boolean;
  isRoot: boolean;
  isExpanded: boolean;
}

@Component({
  selector: 'app-alerts',
  imports: [
    CommonModule,
    ButtonModule, TagModule, TreeTableModule,
    SeverityCssStyleByIdPipe, VulnerabilityCountPipe, TrivyToolbarComponent, GenericObjectArraySummaryPipe,
  ],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {
  treeData: TreeNode<AlertNodeData>[] = [];

  alertsService: AlertsService = inject(AlertsService);

  private readonly severityOrder: Record<string, number> = {
    'Error': 0,
    'Warning': 1,
    'Info': 4,
  };

  ngOnInit() {
   setTimeout(() => {
      this.loadData();
   }, 500);

    this.alertsService.onRefresh().subscribe(() => {
      this.loadData();
    });
  }

  onNodeExpand(event: TreeTableNodeExpandEvent) {
    event.node.data.isExpanded = true;
  }

  onNodeCollapse(event: TreeTableNodeCollapseEvent) {
    event.node.data.isExpanded = false;
  }

  loadData() {
    const alerts = this.alertsService.getAlerts();
    console.log("AlertsComponent ngOnInit - alerts: ", alerts.length);
    this.treeData = this.buildTree(alerts);
  }

  private buildTree(alerts: AlertDto[]): TreeNode<AlertNodeData>[] {
    const dtoMap = new Map<string, AlertNodeData>();

    for (const alert of alerts) {
      const { severity, emitter, emitterKey, category, message } = alert;
      if (!severity || !emitter || !emitterKey || !category) continue;

      const keyPath = [severity, emitter, ...emitterKey.split("|")];
      let key = "";
      let prevNode: AlertNodeData | undefined;

      for (let i = keyPath.length - 1; i >= 0; i--) {
        key = keyPath.slice(0, i + 1).join("|");

        let node = dtoMap.get(key);
        if (node) {
          const statistic = node.statistics?.find(s => s.category === category);
          if (statistic) {
            statistic.count++;
          } else {
            node.statistics.push({category, count: 1});
          }
          node.count++;
          if (prevNode) {
            node.children.push(prevNode);
          }
          prevNode = undefined; // Reset prevNode since we found an existing node
        }
        else {
          node = {
            key,
            level: i,
            label: keyPath[i],
            message: i === keyPath.length - 1 ? message ?? "" : undefined,
            children: prevNode ? [prevNode] : [],
            statistics: [{category, count: 1}],
            count: 1,
            severityId: this.severityOrder[severity] ?? 4, // Default to Info if not found
            isLeaf: i === keyPath.length - 1,
            isRoot: i === 0,
            isExpanded: false,
          };
          dtoMap.set(key, node);
          prevNode = node;
        }
      }
    }

    dtoMap.forEach((value) => {
      value.children = value.children.sort((a, b) => a.label.localeCompare(b.label));
      value.childrenLabels = value.children.map(child => child.label).join(", ");
    });

    const rootNodes = Array.from(dtoMap.values())
      .filter(node => node.isRoot)
      .sort((a, b) => a.severityId - b.severityId);
    return this.convertToTreeNodes(rootNodes);
  }

  private convertToTreeNodes(data: AlertNodeData[]): TreeNode<AlertNodeData>[] {
    return data.map(node => {
      const treeNode: TreeNode<AlertNodeData> = {
        key: node.key,
        label: node.label, // optional, if your tree uses the `label` field directly
        data: node,
        expanded: node.isExpanded,
        leaf: node.isLeaf,
        children: this.convertToTreeNodes(node.children || [])
      };

      return treeNode;
    });
  }


  private sortAlerts(alerts: AlertDto[]): AlertDto[] {
    return alerts.sort((a, b) => {
      // Sort by severity using numeric order
      const severityA = this.severityOrder[a.severity ?? 'Info'];
      const severityB = this.severityOrder[b.severity ?? 'Info'];
      if (severityA !== severityB) return severityA - severityB;

      // Then by emitter (alphabetical)
      const emitterA = a.emitter ?? '';
      const emitterB = b.emitter ?? '';
      if (emitterA !== emitterB) return emitterA.localeCompare(emitterB);

      // Finally by emitterKey (alphabetical)
      const emitterKeyA = a.emitterKey ?? '';
      const emitterKeyB = b.emitterKey ?? '';
      return emitterKeyA.localeCompare(emitterKeyB);
    });
  }
}
