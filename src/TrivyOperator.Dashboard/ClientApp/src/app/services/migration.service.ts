import { Injectable } from '@angular/core';
import { VersionUtils } from '../utils/version.utils';

export type MigrationAction =
  | 'deleteTableDefinition'
  | 'deleteTableField'
  | 'addTableField'
  | 'renameTableField';

export interface MigrationStep {
  version: string;
  action: MigrationAction;
  table?: string;
  oldFieldName?: string;
  newFieldName?: string;
  width?: number;
  anchorLeft?: string;
  anchorRight?: string;
}



@Injectable({
  providedIn: 'root',
})
export class MigrationService {


  applyTableMigrations(fromVersion: string, toVersion: string, migrationSteps: readonly MigrationStep[]) {
    for (const step of migrationSteps) {
      if (!this.isFirstVersionOlder(fromVersion, step.version) || this.isFirstVersionOlder(toVersion, step.version)) continue;
      //if (this.isFirstVersionOlder(toVersion, step.version)) continue;
      console.log("Step version: ", step.version, " - Applying migration step: ", step.action);

      switch (step.action) {
        case 'deleteTableDefinition': {
          const key = step.table ? `trivyTable.${step.table}` : '';
          if (key) localStorage.removeItem(key);
          break;
        }
        case 'deleteTableField': {
          const key = step.table ? `trivyTable.${step.table}` : '';
          const state = this.getTableDefinition(step.table ?? '');
          if (!state.columnOrder || !step.oldFieldName) break;

          state.columnOrder = state.columnOrder.filter((f: string) => f !== step.oldFieldName);
          state.columnWidths = this.recalculateWidths(state.columnOrder, state.columnWidths);
          localStorage.setItem(key, JSON.stringify(state));
          break;
        }
        case 'addTableField': {
          const key = step.table ? `trivyTable.${step.table}` : '';
          const state = this.getTableDefinition(step.table ?? '');
          if (!state.columnOrder || !step.newFieldName || state.columnOrder.includes(step.newFieldName)) break;

          let insertAt = state.columnOrder.length; // default to end

          if (step.anchorLeft && state.columnOrder.includes(step.anchorLeft)) {
            insertAt = state.columnOrder.indexOf(step.anchorLeft) + 1;
          } else if (step.anchorRight && state.columnOrder.includes(step.anchorRight)) {
            insertAt = state.columnOrder.indexOf(step.anchorRight);
          }

          state.columnOrder.splice(insertAt, 0, step.newFieldName);
          state.columnWidths = this.insertWidth(state.columnWidths, insertAt, step.width ?? 100);

          localStorage.setItem(key, JSON.stringify(state));
          break;
        }
        case 'renameTableField': {
          const key = step.table ? `trivyTable.${step.table}` : '';
          const state = this.getTableDefinition(step.table ?? '');
          if (!state.columnOrder || !step.oldFieldName || !step.newFieldName) break;
          if (state.columnOrder.includes(step.newFieldName)) break;

          const renameIndex = state.columnOrder.indexOf(step.oldFieldName);
          if (renameIndex !== -1) {
            state.columnOrder[renameIndex] = step.newFieldName;
            localStorage.setItem(key, JSON.stringify(state));
          }
          break;
        }
        default:
          console.warn(`Unknown migration action: ${step.action}`);
      }
    }
  }

  private isFirstVersionOlder(firstVersion: string, secondVersion: string): boolean {
    return VersionUtils.parseVersion(firstVersion) < VersionUtils.parseVersion(secondVersion);
  }

  private getTableDefinition(tableName: string): any {
    const key = `trivyTable.${tableName}`;
    const raw = localStorage.getItem(key);
    return raw ? this.safelyParse(raw) : null;
  }

  private safelyParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      console.warn('Failed to parse localStorage value.');
      return {};
    }
  }

  private recalculateWidths(order: string[], existing: string = ''): string {
    const existingWidths = existing.split(',');
    return order.map((_, i) => existingWidths[i] ?? '100').join(',');
  }

  private insertWidth(existing: string = '', index: number, width: number): string {
    const arr = existing.split(',');
    arr.splice(index, 0, String(width));
    return arr.join(',');
  }
}
