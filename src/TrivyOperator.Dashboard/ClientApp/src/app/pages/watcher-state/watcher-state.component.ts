import { Component } from '@angular/core';

import { WatcherStateInfoDto } from '../../../api/models/watcher-state-info-dto';
import { WatcherStateInfoService } from '../../../api/services/watcher-state-info.service';

import { TrivyTableComponent } from '../../ui-elements/trivy-table/trivy-table.component';
import { TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';

@Component({
  selector: 'app-watcher-state',
  standalone: true,
  imports: [TrivyTableComponent],
  templateUrl: './watcher-state.component.html',
  styleUrl: './watcher-state.component.scss',
})
export class WatcherStateComponent {
  public watcherStateInfoDtos: WatcherStateInfoDto[] = [];
  public isLoading: boolean = false;

  public trivyTableColumns: TrivyTableColumn[] = [];

  constructor(private watcherStateInfoService: WatcherStateInfoService) {
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
      }
    ];
  }

  public getTableDataDtos() {
    this.isLoading = true;
    this.watcherStateInfoService.getWatcherStateInfos().subscribe({
      next: (res) => this.onGetWatcherStateInfos(res),
      error: (err) => console.error(err),
    });
  }

  onGetWatcherStateInfos(dtos: WatcherStateInfoDto[]) {
    this.watcherStateInfoDtos = dtos;
    this.isLoading = false;
  }
}
