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


interface AlertNodeData {
  label: string;
  message?: string;
  messageCollapsed?: string,
  count: number;
  severityId?: number;
  isLeaf?: boolean;
  isRoot?: boolean;
  isExpanded: boolean;
}

@Component({
  selector: 'app-alerts',
  imports: [
    CommonModule,
    ButtonModule, TagModule, TreeTableModule,
    SeverityCssStyleByIdPipe, VulnerabilityCountPipe, TrivyToolbarComponent,
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
    const severityMap = new Map<string, TreeNode<AlertNodeData>>();
    alerts = this.sortAlerts(alerts); // assume this is a clean util

    for (const alert of alerts) {
      const { severity, emitter, emitterKey, message } = alert;
      if (!severity || !emitter || !emitterKey || !message) continue;

      const keyParts = [emitter, ...emitterKey.split('|')];
      const severityId = this.severityOrder[severity] ?? 4;

      if (!severityMap.has(severity)) {
        severityMap.set(severity, {
          data: {
            label: severity,
            severityId: severityId,
            count: 0,
            isLeaf: false,
            isRoot: true,
            isExpanded: true,
          },
          children: [],
          expanded: true,
        });
      }

      const severityNode = severityMap.get(severity)!;
      this.insertAlert(severityNode, keyParts, message, severityId);
    }

    return Array.from(severityMap.values());
  }

  private insertAlert(
    node: TreeNode<AlertNodeData>,
    keyParts: string[],
    message: string,
    severityId: number,
    depth = 0
  ): void {
    if (!node.data) return;

    node.data.count = (node.data.count || 0) + 1;

    if (depth === keyParts.length) {
      node.data.message = message;
      node.data.isLeaf = true;
      return;
    }

    const part = keyParts[depth];
    let child = node.children?.find(n => n.data?.label === part);

    if (!child) {
      child = {
        data: {
          label: part,
          severityId: severityId,
          count: 0,
          isLeaf: false,
          isExpanded: true,
        },
        children: [],
        expanded: true,
      };
      node.children!.push(child);
    }

    this.insertAlert(child, keyParts, message, severityId, depth + 1);

    if (!node.data.isLeaf && node.children?.length) {
      node.data.messageCollapsed = node.children
        .map(c => c.data?.label)
        .filter(l => !!l)
        .join(', ');
    }
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
