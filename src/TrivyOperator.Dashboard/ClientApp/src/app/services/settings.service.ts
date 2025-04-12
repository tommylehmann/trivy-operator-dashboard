import { Injectable } from '@angular/core';

export type SeverityColorByNameOption = "all" | "greyNulls" | "greyBelowOne" | "hideNonPositive";

@Injectable({
  providedIn: 'root',
})

export class SettingsService {
  private _severityColorByNameOptionDefault: SeverityColorByNameOption = "greyBelowOne";
  private _severityColorByNameOption: SeverityColorByNameOption | null = null;
  severityColorByNameOptions: ReadonlyArray<SeverityColorByNameOption> = ["all", "greyNulls", "greyBelowOne", "hideNonPositive"];

  get severityColorByNameOption(): SeverityColorByNameOption {
    if (!this._severityColorByNameOption) {
      this._severityColorByNameOption =
        (localStorage.getItem("severityColorByNameOption") as SeverityColorByNameOption) ?? this._severityColorByNameOptionDefault;
    }

    return this._severityColorByNameOption;
  }

  set severityColorByNameOption(value: SeverityColorByNameOption) {
    this._severityColorByNameOption = value;
    localStorage.setItem("severityColorByNameOption", value);
  }
}
