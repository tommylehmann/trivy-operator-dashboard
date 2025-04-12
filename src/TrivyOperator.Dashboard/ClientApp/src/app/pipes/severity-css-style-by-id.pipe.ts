import { Pipe, PipeTransform } from '@angular/core';
import { SeverityUtils } from '../utils/severity.utils';
import { SeverityColorByNameOption } from '../services/settings.service';

@Pipe({
  name: 'severityCssStyleById',
  standalone: true,
})
export class SeverityCssStyleByIdPipe implements PipeTransform {
  transform(
      severityIdStr: string,
      severityCount: number = 0,
      option: SeverityColorByNameOption = "hideNonPositive"): { [key: string]: string } {
    let cssColor = "";
    let opacity = '';
    const severityId = !isNaN(Number(severityIdStr)) ? Number(severityIdStr) : -1;
    switch (option) {
      case "all":
        cssColor = SeverityUtils.getCssColor(severityId);
        opacity = '1';
        break;
      case "greyNulls":
        cssColor = severityCount < 0 ? "grey" : SeverityUtils.getCssColor(severityId);
        opacity = severityCount < 0 ? '0.2' : '1';
        break;
      case "greyBelowOne":
        cssColor = severityCount < 1 ? "grey" : SeverityUtils.getCssColor(severityId);
        opacity = severityCount < 1 ? '0.2' : '1';
        break;
      case "hideNonPositive":
        cssColor = severityCount > 0 ? SeverityUtils.getCssColor(severityId) : "transparent";
        opacity = severityCount > 0 ? '1' : '0';
        break;
    }
    
    return {
      'background': cssColor,
      'opacity': opacity
    };
  }
}
