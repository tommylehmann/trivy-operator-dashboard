import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanCssStyle',
  standalone: true,
})
export class BooleanCssStylePipe implements PipeTransform {
  transform(data: boolean): { [key: string]: string } {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
      'background': documentStyle.getPropertyValue(`--p-${data ? 'blue' : 'gray'}-400`),
    };
  }
}
