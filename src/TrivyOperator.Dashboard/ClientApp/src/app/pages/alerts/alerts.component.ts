import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { AlertsService } from '../../services/alerts.service';
import { AlertDto } from '../../../api/models/alert-dto';

import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';


@Component({
  selector: 'app-alerts',
  imports: [CommonModule, TagModule, TreeTableModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {
  treeData: TreeNode[] = [];

  alertsService: AlertsService = inject(AlertsService);

  ngOnInit() {
//    setTimeout(() => {
      const alerts = this.alertsService.getAlerts();
      console.log("AlertsComponent ngOnInit - alerts: ", alerts.length);
      this.treeData = this.buildTree(alerts);
//    }, 1000);

  }

  buildTree(alerts: AlertDto[]): TreeNode[] {
    const severityMap = new Map<string, TreeNode>();

    for (const alert of alerts) {
      const { severity, emitter, emitterKey, message } = alert;
      if (!severity || !emitter || !emitterKey || !message) continue;

      const keyParts = emitterKey.split('|');

      if (!severityMap.has(severity)) {
        severityMap.set(severity, {
          data: { label: severity },
          children: [],
          expanded: true
        });
      }
      const severityNode = severityMap.get(severity)!;

      let emitterNode = severityNode.children!.find(n => n.data.label === emitter);
      if (!emitterNode) {
        emitterNode = {
          data: { label: emitter },
          children: [],
          expanded: true
        };
        severityNode.children!.push(emitterNode);
      }

      let currentNode = emitterNode;
      for (let i = 0; i < keyParts.length; i++) {
        const part = keyParts[i];
        let child = currentNode.children!.find(n => n.data.label === part);
        if (!child) {
          child = {
            data: {
              label: part,
              message: '',
              count: 0
            },
            children: [],
            expanded: true
          };
          currentNode.children!.push(child);
        }
        currentNode = child;
      }

      // Final node: update message and count
      currentNode.data.message = message;
      currentNode.data.count = (currentNode.data.count || 0) + 1;
    }

    return Array.from(severityMap.values());
  }
}
