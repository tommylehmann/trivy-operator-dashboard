import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanCssStyle',
  standalone: true,
})
export class BooleanCssStylePipe implements PipeTransform {
  transform(data: boolean): { [key: string]: string } {
    const documentStyle = getComputedStyle(document.documentElement);
    //const mainColor = data ? 'blue' : 'bluegray'
    //const color: string = '--' + mainColor + '-400';

    return {
      'background': documentStyle.getPropertyValue(`--${data ? 'blue' : 'bluegray'}-400`),
    };
  }
}
