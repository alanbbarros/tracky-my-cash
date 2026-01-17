import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BudgetCategory } from '../../models/budget.model';
import { BillingCycle } from '../../models/calendar.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-monthly-budget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monthly-budget.component.html',
  styleUrl: './monthly-budget.component.scss'
})
export class MonthlyBudgetComponent {
  @Input({ required: true }) cycle!: BillingCycle;
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

  percentUsed(category: BudgetCategory): number {
    if (!category.planned) {
      return 0;
    }

    return Math.min((category.committed / category.planned) * 100, 100);
  }

  overallUsage(): number {
    const planned = this.totalPlanned();
    if (!planned) {
      return 0;
    }

    return Math.min((this.totalCommitted() / planned) * 100, 100);
  }

  remaining(category: BudgetCategory): number {
    return category.planned - category.committed;
  }
}
