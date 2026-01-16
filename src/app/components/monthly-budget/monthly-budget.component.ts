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

  totalPlanned(): number {
    return this.categories.reduce((total, category) => total + category.planned, 0);
  }

  totalCommitted(): number {
    return this.categories.reduce((total, category) => total + category.committed, 0);
  }

  totalRemaining(): number {
    return this.totalPlanned() - this.totalCommitted();
  }

  remaining(category: BudgetCategory): number {
    return category.planned - category.committed;
  }

  usagePercent(category: BudgetCategory): number {
    if (category.planned <= 0) {
      return 0;
    }

    return Math.min((category.committed / category.planned) * 100, 140);
  }

  remainingPercent(category: BudgetCategory): number {
    if (category.planned <= 0) {
      return 0;
    }

    return Math.max(100 - (category.committed / category.planned) * 100, 0);
  }

  isOverBudget(category: BudgetCategory): boolean {
    return category.committed > category.planned;
  }
}
