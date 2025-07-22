import { MigrationStep } from '../services/migration.service';

export const trivyMigrations: readonly MigrationStep[] = [
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Compliance Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Compliance Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Compliance Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster RBAC Assessment Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster RBAC Assessment Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster RBAC Assessment Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Vulnerability Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Vulnerability Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Cluster Vulnerability Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Config Audit Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Config Audit Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Config Audit Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'RBAC Assessment Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'RBAC Assessment Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'RBAC Assessment Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'SBOM Reports - Depends On' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'SBOM Reports - Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Vulnerability Reports - Main' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Vulnerability Reports - Details' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Vulnerability Reports Detailed' },
  // { version: '1.4', action: 'deleteTableDefinition', table: 'Watcher States' },
  { version: '1.4', action: 'deleteAllTableDefinitions' },

  { version: '1.7', action: 'renameTableField', table: 'SBOM Reports - Detailed', oldFieldName: 'repository', newFieldName: 'imageRepository' },
]
