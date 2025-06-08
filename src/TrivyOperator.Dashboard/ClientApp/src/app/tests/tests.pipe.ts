import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tests',
  standalone: true,
})
export class TestsPipe implements PipeTransform {
  transform(data: string): string {
    if (!data) {
      return data;
    }
    return new Date().toISOString();
  }
}
