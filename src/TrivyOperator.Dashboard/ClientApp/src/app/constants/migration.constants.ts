import { MigrationStep } from '../services/migration.service';

export const trivyMigrations: readonly MigrationStep[] = [
  { version: '1.4', action: 'deleteAllTableDefinitions' },

  { version: '1.7', action: 'renameTableField', table: 'SBOM Reports - Detailed', oldFieldName: 'repository', newFieldName: 'imageRepository' },
]
