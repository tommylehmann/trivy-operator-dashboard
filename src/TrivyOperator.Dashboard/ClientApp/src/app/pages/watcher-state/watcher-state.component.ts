import { Component, inject, OnInit } from '@angular/core';

import { WatcherStatusDto } from '../../../api/models/watcher-status-dto';
import { WatcherStatusService } from '../../../api/services/watcher-status.service';

import { TrivyTableComponent } from '../../ui-elements/trivy-table/trivy-table.component';
import { TrivyTableColumn } from '../../ui-elements/trivy-table/trivy-table.types';
import { ApiWatcherStatusRecreatePost$Params } from '../../../api/fn/watcher-status/api-watcher-status-recreate-post';
import { watcherStateColumns } from '../constants/watcher-state.constants';

import { ButtonModule }  from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-watcher-state',
  standalone: true,
  imports: [ButtonModule, DialogModule, TrivyTableComponent],
  templateUrl: './watcher-state.component.html',
  styleUrl: './watcher-state.component.scss',
})
export class WatcherStateComponent implements OnInit {
  watcherStateInfoDtos: WatcherStatusDto[] = [];
  isLoading: boolean = false;

  trivyTableColumns: TrivyTableColumn[] = [...watcherStateColumns];

  isRecreateWatcherDialogVisible: boolean = false;
  isActionStarted: boolean = false;
  requestedRecreateWatcher?: WatcherStatusDto;
  recreateWatcherResponseMessage?: string;
  recreateWatcherResponseError?: string;

  private readonly service = inject(WatcherStatusService);

  ngOnInit() {
    this.getTableDataDtos();
  }

  public getTableDataDtos() {
    this.isLoading = true;
    this.service.getWatcherStateInfos().subscribe({
      next: (res) => this.onGetWatcherStateInfos(res),
      error: (err) => console.error(err),
    });
  }

  onGetWatcherStateInfos(dtos: WatcherStatusDto[]) {
    dtos.forEach((dto) => {
      // dto.kubernetesObjectType = this.unPascalCase(dto.kubernetesObjectType, ['Cr']);
      dto.eventsGauge = (dto.eventsGauge ?? -1) < 0 ? -1 : dto.eventsGauge;
    });
    this.watcherStateInfoDtos = dtos;
    this.isLoading = false;
  }

  onRowActionRequested(event: { row: WatcherStatusDto, col: string }) {
    const { row, col } = event;

    if (col === 'recreateAction' && row.kubernetesObjectType) {
      this.requestedRecreateWatcher = row;
      this.recreateWatcherResponseMessage = undefined;
      this.recreateWatcherResponseError = undefined;
      this.isActionStarted = false;
      this.isRecreateWatcherDialogVisible = true;

    } else {
      console.warn('Cannot recreate watcher: Missing type or incorrect action');
    }
  }

  onRecreateWatcherRequested() {
    if (!this.requestedRecreateWatcher) return;

    this.isActionStarted = true;
    const params: ApiWatcherStatusRecreatePost$Params = {
      body: {
        kubernetesObjectType: this.requestedRecreateWatcher.kubernetesObjectType,
        namespaceName: this.requestedRecreateWatcher.namespaceName  // Fallback if null
      }
    };

    this.service.apiWatcherStatusRecreatePost(params).subscribe({
      next: (resp) => {
        this.recreateWatcherResponseMessage = resp.message ?? '';
      },
      error: (err) => {
        this.recreateWatcherResponseMessage = 'Error recreating watcher.';
        if (err.status === 422) {
          const payload = err.error;
          this.recreateWatcherResponseError = payload ?? 'Unprocessable Entity.';
        } else {
          console.error('Unexpected Error:', err.message);
        }
      }
    });
  }
}
