import { Injectable } from '@angular/core';

export type SeverityColorByNameOption = "all" | "grayNulls" | "grayBelowOne" | "hideNonPositive";

@Injectable({
  providedIn: 'root',
})

export class SettingsService {
  private _severityCssStyleByIdOptionDefault: SeverityColorByNameOption = "grayBelowOne";
  private _severityCssStyleByIdOption: SeverityColorByNameOption | null = null;
  severityCssStyleByIdOptions: ReadonlyArray<SeverityColorByNameOption> = ["all", "grayNulls", "grayBelowOne", "hideNonPositive"];

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
}
