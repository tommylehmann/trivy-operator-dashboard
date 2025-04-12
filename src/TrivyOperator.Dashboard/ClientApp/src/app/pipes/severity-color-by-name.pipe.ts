import { Pipe, PipeTransform } from '@angular/core';
import { SeverityUtils } from '../utils/severity.utils';
import { SeverityColorByNameOption } from '../services/settings.service';

@Pipe({
  name: 'severityColorByName',
  standalone: true,
})
export class SeverityColorByNamePipe implements PipeTransform {
  transform(
    severityName: string,
    severityCount: number = 0,
    option: SeverityColorByNameOption = "hideNonPositive"): { [key: string]: string } {
    let cssColor = "";
    let opacity = '';
    switch (option) {
      case "all":
        cssColor = SeverityUtils.getCssColorByName(severityName);
        opacity = '1';
        break;
      case "greyNulls":
        cssColor = severityCount < 0 ? "grey" : SeverityUtils.getCssColorByName(severityName);
        opacity = severityCount < 0 ? '0.2' : '1';
        break;
      case "greyBelowOne":
        cssColor = severityCount < 1 ? "grey" : SeverityUtils.getCssColorByName(severityName);
        opacity = severityCount < 1 ? '0.2' : '1';
        break;
      case "hideNonPositive":
        cssColor = severityCount > 0 ? SeverityUtils.getCssColorByName(severityName) : "transparent";
        opacity = severityCount > 0 ? '1' : '0';
        break;
    }
    
    return {
      'background': cssColor,
      'opacity': opacity
    };
  }
}
