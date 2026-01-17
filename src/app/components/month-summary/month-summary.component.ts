import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BillingCycle } from '../../models/calendar.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-month-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-summary.component.html',
  styleUrl: './month-summary.component.scss'
})
export class MonthSummaryComponent {
  @Input() month: BillingCycle | null = null;

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }
}
