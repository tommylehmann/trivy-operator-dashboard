import { Injectable } from '@angular/core';

import { AppVersionService } from '../../api/services/app-version.service';
import { Observable } from 'rxjs';
import { AppVersion } from '../../api/models';

export type SeverityColorByNameOption = "all" | "grayNulls" | "grayBelowOne" | "hideNonPositive";

@Injectable({
  providedIn: 'root',
})

export class SettingsService {
  private _severityCssStyleByIdOptionDefault: SeverityColorByNameOption = "grayBelowOne";
  private _severityCssStyleByIdOption: SeverityColorByNameOption | null = null;
  severityCssStyleByIdOptions: ReadonlyArray<SeverityColorByNameOption> = ["all", "grayNulls", "grayBelowOne", "hideNonPositive"];

  constructor(private appVersionService: AppVersionService) {

  }

  get severityCssStyleByIdOption(): SeverityColorByNameOption {
    if (!this._severityCssStyleByIdOption) {
      this._severityCssStyleByIdOption =
        (localStorage.getItem("severityCssStyleByIdOption") as SeverityColorByNameOption) ?? this._severityCssStyleByIdOptionDefault;
    }

    return this._severityCssStyleByIdOption;
  }

  set severityCssStyleByIdOption(value: SeverityColorByNameOption) {
    this._severityCssStyleByIdOption = value;
    localStorage.setItem("severityCssStyleByIdOption", value);
  }

  getAppVersion(): Observable<AppVersion> {
    return this.appVersionService.getCurrentVersion();
  }
}
