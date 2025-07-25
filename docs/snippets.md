Example package.json:

```json
"scripts": {
  "postinstall": "node ./scripts/fix-tailwindcss-primeui.js"
}
```

2.	Add a file named fix-tailwindcss-primeui.js 
```js
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(
  __dirname,
  '../node_modules/tailwindcss-primeui/package.json'
);

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.type = 'module';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Added "type": "module" to tailwindcss-primeui/package.json');
} catch (error) {
  console.error('Failed to update tailwindcss-primeui/package.json:', error);
}
```

## alerts snips

```ts
import { TreeNode } from 'primeng/api';

buildTree(alerts: AlertDto[]): TreeNode[] {
  const severityMap = new Map<string, TreeNode>();

  for (const alert of alerts) {
    const { Severity, Emitter, EmitterKey, Message } = alert;
    const keyParts = EmitterKey.split('|');

    if (!severityMap.has(Severity)) {
      severityMap.set(Severity, {
        data: { label: Severity },
        children: [],
        expanded: true
      });
    }
    const severityNode = severityMap.get(Severity)!;

    let emitterNode = severityNode.children!.find(n => n.data.label === Emitter);
    if (!emitterNode) {
      emitterNode = {
        data: { label: Emitter },
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
    currentNode.data.message = Message;
    currentNode.data.count = (currentNode.data.count || 0) + 1;
  }

  return Array.from(severityMap.values());
}
```

```html
<p-treeTable [value]="treeData">
  <ng-template pTemplate="header">
    <tr>
      <th>Node</th>
      <th>Message</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
    <tr [ttRow]="rowNode">
      <td>
        <p-treeTableToggler [rowNode]="rowNode" />
        {{ rowData.label }}
        <p-badge *ngIf="rowData.count" [value]="rowData.count" severity="info" styleClass="ml-2" />
      </td>
      <td>{{ rowData.message || '' }}</td>
    </tr>
  </ng-template>
</p-treeTable>
```

```ts
treeData: TreeNode[] = [];

ngOnInit() {
  const alerts = this.alertsService.getAlerts();
  this.treeData = this.buildTree(alerts);
}
```