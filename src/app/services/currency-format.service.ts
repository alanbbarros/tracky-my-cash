import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrencyFormatService {
  private readonly formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  format(value: number): string {
    return this.formatter.format(value);
  }
}
