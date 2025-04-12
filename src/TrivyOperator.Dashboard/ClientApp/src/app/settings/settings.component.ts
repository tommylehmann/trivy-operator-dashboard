import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { SelectButtonModule, SelectButtonOptionClickEvent } from 'primeng/selectbutton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';

import { BackendSettingsDto } from '../../api/models/backend-settings-dto';
import { MainAppInitService } from '../services/main-app-init.service';
import { LocalStorageUtils } from '../utils/local-storage.utils';
import { PrimengTableStateUtil } from '../utils/primeng-table-state.util';
import { ClearTablesOptions, SavedCsvFileName, TrivyReportConfig } from './settings.types';
import { SettingsService, SeverityColorByNameOption } from '../services/settings.service';

import { VulnerabilityCountPipe } from '../pipes/vulnerability-count.pipe';
import { SeverityCssStyleByIdPipe } from '../pipes/severity-css-style-by-id.pipe';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    PanelModule,
    SelectButtonModule,
    StepsModule,
    TableModule,
    TagModule,
    VulnerabilityCountPipe,
    SeverityCssStyleByIdPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  public clearTablesOptions: ClearTablesOptions[] = [];
  public csvFileNames: SavedCsvFileName[] = [];
  public trivyReportConfigs: TrivyReportConfig[] = [];

  severityCssStyleByIdOptionItems: MenuItem[] = [];
  severityCssStyleByIdOptions: SeverityColorByNameOption[] = [];
  severityCssStyleByIdOptionIndex: number = 0;
  severityCssStyleByIdOptionValueSamples: number[] = [1, 0, -1];
  severityCssStyleByIdOptionDescription: string = "";

  severityCssStyleByIdOptions2: { id: SeverityColorByNameOption, label: string }[] = [];
  severityCssStyleByIdOptionValue2: SeverityColorByNameOption = 'greyBelowOne';

  constructor(private mainAppInitService: MainAppInitService, private settingsService: SettingsService) { }

  ngOnInit() {
    this.loadTableOptions();
    this.loadCsvFileNames();
    this.loadSeverityColorByName();
    this.mainAppInitService.backendSettingsDto$.subscribe((updatedBackendSettingsDto) => {
      this.loadTrivyReportsStates(updatedBackendSettingsDto);
    });
  }

  onClearTableStatesSelected(_event: MouseEvent) {
    this.clearTablesOptions.forEach((option) => {
      const tableStateJson = localStorage.getItem(option.dataKey);
      if (tableStateJson) {
        if (option.all) {
          localStorage.removeItem(option.dataKey);
        } else {
          const tableState = JSON.parse(tableStateJson);
          if (option.filters) {
            PrimengTableStateUtil.clearTableFilters(tableState);
          }
          if (option.sort) {
            PrimengTableStateUtil.clearTableMultiSort(tableState);
          }
          if (option.columnWidths) {
            PrimengTableStateUtil.clearTableColumnWidths(tableState);
          }
          if (option.columnOrder) {
            PrimengTableStateUtil.clearTableColumnOrder(tableState);
          }
          localStorage.setItem(option.dataKey, JSON.stringify(tableState));
        }
      }
    });
    this.loadTableOptions();
  }

  onClearTableStatesAll(_event: MouseEvent) {
    this.clearTablesOptions.forEach((option) => {
      const tableStateJson = localStorage.getItem(option.dataKey);
      if (tableStateJson) {
        localStorage.removeItem(option.dataKey);
      }
    });
    this.loadTableOptions();
  }

  onUpdateCsvFileNames(_event: MouseEvent) {
    this.csvFileNames.forEach((x) => {
      localStorage.setItem(x.dataKey, x.savedCsvName);
    });
  }

  onUpdateTrivyReportsStates(_event: MouseEvent) {
    this.mainAppInitService.updateBackendSettingsTrivyReportConfigDto(
      this.trivyReportConfigs.filter((x) => x.frontendEnabled).map((x) => x.id),
    );
  }

  onSeverityColorByNameOptionIndex(event: number) {
    this.setSeverityColorByNameOptionIndex(event);
  }

  private loadTableOptions() {
    this.clearTablesOptions = LocalStorageUtils.getKeysWithPrefix(LocalStorageUtils.trivyTableKeyPrefix)
      .sort((x, y) => (x > y ? 1 : -1))
      .map((x) => {
        return new ClearTablesOptions(x, x.slice(LocalStorageUtils.trivyTableKeyPrefix.length));
      });
  }

  private loadCsvFileNames() {
    this.csvFileNames = LocalStorageUtils.getKeysWithPrefix(LocalStorageUtils.csvFileNameKeyPrefix)
      .sort((x, y) => (x > y ? 1 : -1))
      .map((x) => {
        return {
          dataKey: x,
          description: x.slice(LocalStorageUtils.csvFileNameKeyPrefix.length),
          savedCsvName: localStorage.getItem(x) ?? '',
        };
      });
  }

  private loadTrivyReportsStates(backendSettingsDto: BackendSettingsDto) {
    const defaultBackedSettings = this.mainAppInitService.defaultBackendSettingsDto ?? { trivyReportConfigDtos: [] };
    this.trivyReportConfigs =
      backendSettingsDto.trivyReportConfigDtos?.map((x) => ({
        id: x.id ?? '',
        name: x.name ?? '',
        backendEnabled: defaultBackedSettings.trivyReportConfigDtos?.find((def) => def.id === x.id)?.enabled ?? false,
        frontendEnabled: x.enabled ?? false,
      })) ?? [];
  }

  private loadSeverityColorByName() {
    this.severityCssStyleByIdOptionItems = this.settingsService.severityCssStyleByIdOptions.map(x => ({label: "-"}));
    this.severityCssStyleByIdOptions = this.settingsService.severityCssStyleByIdOptions.map(x => x);
    this.setSeverityColorByNameOptionIndex(this.settingsService.severityCssStyleByIdOptions.indexOf(this.settingsService.severityCssStyleByIdOption));

    this.severityCssStyleByIdOptions2 = this.settingsService.severityCssStyleByIdOptions.map(x => {
      let label = "";
      switch (x) {
        case 'all':
          label = "All";
          break;
        case 'greyBelowOne':
          label = 'Non Zero';
          break;
        case 'greyNulls':
          label = "Non Null";
          break;
        case 'hideNonPositive':
          label = "Only Non Zero";
          break;
      }
      return { id: x, label: label };
    });
    this.severityCssStyleByIdOptionValue2 = this.settingsService.severityCssStyleByIdOption;
  }

  onSeverityCssStyleByIdOptionsClick(event: SelectButtonOptionClickEvent) {
    if (event.index) {
      this.setSeverityColorByNameOptionIndex(event.index);
    }
  }

  private setSeverityColorByNameOptionIndex(index: number) {
    this.severityCssStyleByIdOptionIndex = index;
    this.settingsService.severityCssStyleByIdOption = this.settingsService.severityCssStyleByIdOptions[index] ?? this.settingsService.severityCssStyleByIdOption;
    switch (index) {
      case 0:
        this.severityCssStyleByIdOptionDescription = "All are visible";
        break;
      case 1:
        this.severityCssStyleByIdOptionDescription = "All not null (0 and above) are visible; rest are faint";
        break;
      case 2:
        this.severityCssStyleByIdOptionDescription = "All above 0 are visible; rest are faint";
        break;
      case 3:
        this.severityCssStyleByIdOptionDescription = "All above 0 are visible; rest are not";
        break;
    }
  }
}
