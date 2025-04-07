import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanStyle',
  standalone: true,
})
export class BooleanStylePipe implements PipeTransform {
  transform(data: boolean): string {
    const documentStyle = getComputedStyle(document.documentElement);
    const mainColor = data ? 'blue' : 'bluegray'
    const color: string = '--' + mainColor + '-400';

    return documentStyle.getPropertyValue(color);
  }
}
