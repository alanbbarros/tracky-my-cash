import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BudgetCategory } from '../../models/budget.model';
import { CalendarMonth } from '../../models/calendar.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-monthly-budget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss'
})
export class MonthlyBudgetComponent {
  @Input({ required: true }) month!: CalendarMonth;
  @Input() categories: BudgetCategory[] = [];
  @Output() closeBudget = new EventEmitter<void>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  remaining(category: BudgetCategory): number {
    return category.planned - category.committed;
  }
}
