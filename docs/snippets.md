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

```ts
export type TableMigrationAction =
  | 'deleteDefinition'
  | 'deleteField'
  | 'addField'
  | 'renameField';

export interface TableMigrationStep {
  version: string;
  action: TableMigrationAction;
  table?: string;
  oldFieldName?: string;
  newFieldName?: string;
  width?: number;
}
/*
[
  { version: '1.4', action: 'deleteDefinition', table: 'vulnerabilityReports' },
  { version: '1.4', action: 'deleteField', table: 'vulnerabilityReports', oldFieldName: 'deprecatedField' },
  { version: '1.4', action: 'addField', table: 'vulnerabilityReports', newFieldName: 'newSeverity', width: 90 },
  { version: '1.7', action: 'renameField', table: 'sbom detailed', oldFieldName: 'repository', newFieldName: 'imageRepository' }
]
*/

function parseVersion(version: string): number {
  const parts = version.replace('v', '').split('.');
  const x = parseInt(parts[0], 10) || 0;
  const y = parseInt(parts[1], 10) || 0;
  const z = parseInt(parts[2], 10) || 0;
  return x * 10000 + y * 100 + z;
}

function isOlder(oldVersion: string, newVersion: string): boolean {
  return parseVersion(oldVersion) < parseVersion(newVersion);
}

function applyTableMigrations(fromVersion: string, toVersion: string, migrationSteps: TableMigrationStep[]) {
  for (const step of migrationSteps) {
    if (!isOlder(fromVersion, step.version) || !step.action) continue;

    const key = step.table ? `trivyTable.${step.table}` : '';
    const raw = key ? localStorage.getItem(key) : null;
    let state: any = raw ? safelyParse(raw) : {};

    switch (step.action) {
      case 'deleteDefinition':
        if (key) localStorage.removeItem(key);
        break;

      case 'deleteField':
        if (!state.columnOrder || !step.oldFieldName) break;
        state.columnOrder = state.columnOrder.filter((f: string) => f !== step.oldFieldName);
        state.columnWidths = recalculateWidths(state.columnOrder, state.columnWidths);
        localStorage.setItem(key, JSON.stringify(state));
        break;

      case 'addField':
        if (!state.columnOrder || !step.newFieldName || state.columnOrder.includes(step.newFieldName)) break;
        const insertAt = state.columnOrder.length; // no anchor logic yet
        state.columnOrder.splice(insertAt, 0, step.newFieldName);
        state.columnWidths = insertWidth(state.columnWidths, insertAt, step.width ?? 100);
        localStorage.setItem(key, JSON.stringify(state));
        break;

      case 'renameField':
        if (!state.columnOrder || !step.oldFieldName || !step.newFieldName) break;
        if (state.columnOrder.includes(step.newFieldName)) break;
        const renameIndex = state.columnOrder.indexOf(step.oldFieldName);
        if (renameIndex !== -1) {
          state.columnOrder[renameIndex] = step.newFieldName;
          localStorage.setItem(key, JSON.stringify(state));
        }
        break;

      default:
        console.warn(`Unknown migration action: ${step.action}`);
    }
  }
}

function safelyParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    console.warn('Failed to parse localStorage value.');
    return {};
  }
}

function recalculateWidths(order: string[], existing: string = ''): string {
  const existingWidths = existing.split(',');
  return order.map((_, i) => existingWidths[i] ?? '100').join(',');
}

function insertWidth(existing: string = '', index: number, width: number): string {
  const arr = existing.split(',');
  arr.splice(index, 0, String(width));
  return arr.join(',');
}


```