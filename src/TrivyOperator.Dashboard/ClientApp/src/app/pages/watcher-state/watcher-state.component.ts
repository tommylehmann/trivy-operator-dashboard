import { Component, inject } from '@angular/core';

import { WatcherStatusDto } from '../../../api/models/watcher-status-dto';
import { WatcherStatusService } from '../../../api/services/watcher-status.service';

import { TrivyTableComponent } from '../../ui-elements/trivy-table/trivy-table.component';
import { TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';
import { ApiWatcherStatusRecreatePost$Params } from '../../../api/fn/watcher-status/api-watcher-status-recreate-post';

@Component({
  selector: 'app-watcher-state',
  standalone: true,
  imports: [TrivyTableComponent],
  templateUrl: './watcher-state.component.html',
  styleUrl: './watcher-state.component.scss',
})
export class WatcherStateComponent {
  public watcherStateInfoDtos: WatcherStatusDto[] = [];
  public isLoading: boolean = false;

  public trivyTableColumns: TrivyTableColumn[] = [];

  private readonly service = inject(WatcherStatusService);

  constructor() {
    this.getTableDataDtos();
    this.trivyTableColumns = [
      {
        field: 'kubernetesObjectType',
        header: 'k8s Object',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 200px;',
        renderType: 'standard',
      },
      {
        field: 'namespaceName',
        header: 'NS',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'standard',
      },
      {
        field: 'status',
        header: 'Status',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 130px; max-width: 130px;',
        renderType: 'semaphore',
      },
      {
        field: 'mitigationMessage',
        header: 'Mitigation',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 330px; max-width: 330px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'lastException',
        header: 'Last Exception',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 330px; max-width: 330px; white-space: normal;',
        renderType: 'standard',
      },
      {
        field: 'lastEventMoment',
        header: 'Last Event',
        isFilterable: true,
        isSortable: true,
        multiSelectType: 'none',
        style: 'width: 155px; max-width: 155px;',
        renderType: 'dateTime',
      },
      {
        field: 'recreateAction',
        header: 'Recreate Watcher',
        isFilterable: false,
        isSortable: false,
        multiSelectType: 'none',
        style: 'width: 155px; max-width: 155px;',
        renderType: 'action',
        extraFields: ['do it baby!'],
      },
    ];
  }

  public getTableDataDtos() {
    this.isLoading = true;
    this.service.getWatcherStateInfos().subscribe({
      next: (res) => this.onGetWatcherStateInfos(res),
      error: (err) => console.error(err),
    });
  }

  onGetWatcherStateInfos(dtos: WatcherStatusDto[]) {
    this.watcherStateInfoDtos = dtos;
    this.isLoading = false;
  }

  onRowActionRequested(event: {row: WatcherStatusDto, col: string}) {
    const { row, col } = event;
    console.log('onRowActionRequested', col, row.kubernetesObjectType);

    if (col === 'recreateAction' && row.kubernetesObjectType) {
      const params: ApiWatcherStatusRecreatePost$Params = {
        body: {
          kubernetesObjectType: row.kubernetesObjectType,
          namespaceName: row.namespaceName  // Fallback if null
        }
      };

      this.service.apiWatcherStatusRecreatePost(params).subscribe({
        next: () => {
          console.log(`Recreated watcher: ${row.kubernetesObjectType}`);
        },
        error: (err) => {
          console.error('Failed to recreate watcher:', err);
          // You could show a snackbar or log the error visually
        }
      });
    } else {
      console.warn('Cannot recreate watcher: Missing type or incorrect action');
    }
  }
}
