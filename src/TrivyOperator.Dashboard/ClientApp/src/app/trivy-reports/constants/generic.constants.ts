import { TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';

export const namespacedColumns: readonly TrivyTableColumn[] = [
  {
    field: 'resourceNamespace',
    header: 'NS',
    isFilterable: true,
    isSortable: true,
    multiSelectType: 'namespaces',
    style: 'width: 130px; max-width: 130px;',
    renderType: 'standard',
  },
];
