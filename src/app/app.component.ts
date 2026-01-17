import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarDay, CalendarMonth } from './models/calendar.model';
import { BudgetCategory } from './models/budget.model';
import { NewTransaction, Transaction } from './models/transaction.model';
import { CalendarSectionComponent } from './components/calendar-section/calendar-section.component';
import { DetailsPanelComponent } from './components/details-panel/details-panel.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { MonthlyBudgetComponent } from './components/monthly-budget/monthly-budget.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { TransactionStoreService } from './services/transaction-store.service';
import { buildCalendarMonths } from './utils/calendar.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    CalendarSectionComponent,
    DetailsPanelComponent,
    EntryModalComponent,
    MonthlyBudgetComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);

  months: CalendarMonth[] = [];
  selectedDay: CalendarDay | null = null;
  focusedMonth: CalendarMonth | null = null;
  activeBudgetMonth: CalendarMonth | null = null;
  budgetCategories: BudgetCategory[] = [];
  isModalOpen = false;

  constructor(private readonly transactionStore: TransactionStoreService) {
    this.syncFromTransactions(this.transactionStore.getSnapshot());

    this.transactionStore.transactions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((transactions) => this.syncFromTransactions(transactions));
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSelectDay(day: CalendarDay): void {
    if (this.selectedDay?.isoDate === day.isoDate) {
      this.selectedDay = null;
      this.focusedMonth = this.findMonthForDay(day, this.months);
      return;
    }

    this.selectedDay = day;
    this.focusedMonth = this.findMonthForDay(day, this.months);
  }

  openBudget(month: CalendarMonth): void {
    this.activeBudgetMonth = month;
    this.budgetCategories = this.buildBudgetCategories(month);
  }

  closeBudget(): void {
    this.activeBudgetMonth = null;
  }

  onSaveEntry(entry: NewTransaction): void {
    this.transactionStore.addTransaction(entry);
    this.closeModal();
  }

  get canGoPrevious(): boolean {
    return this.canShiftFocusedMonth(-1);
  }

  get canGoNext(): boolean {
    return this.canShiftFocusedMonth(1);
  }

  goToPreviousMonth(): void {
    this.shiftFocusedMonth(-1);
  }

  goToNextMonth(): void {
    this.shiftFocusedMonth(1);
  }

  private syncFromTransactions(transactions: Transaction[]): void {
    this.months = buildCalendarMonths(20, transactions);
    this.selectedDay = this.resolveSelectedDay(this.selectedDay, this.months);
    this.focusedMonth = this.resolveFocusedMonth(this.focusedMonth, this.months, this.selectedDay);
    if (this.activeBudgetMonth) {
      this.activeBudgetMonth = this.resolveActiveBudgetMonth(this.activeBudgetMonth, this.months);
      if (this.activeBudgetMonth) {
        this.budgetCategories = this.buildBudgetCategories(this.activeBudgetMonth);
      }
    }
  }

  private resolveSelectedDay(current: CalendarDay | null, months: CalendarMonth[]): CalendarDay | null {
    if (!months.length) {
      return null;
    }

    if (!current) {
      return null;
    }

    const targetIso = current?.isoDate;
    if (targetIso) {
      for (const month of months) {
        for (const cell of month.cells) {
          if (cell.day?.isoDate === targetIso) {
            return cell.day;
          }
        }
      }
    }

    return null;
  }

  private resolveFocusedMonth(
    current: CalendarMonth | null,
    months: CalendarMonth[],
    selectedDay: CalendarDay | null
  ): CalendarMonth | null {
    if (!months.length) {
      return null;
    }

    if (selectedDay) {
      return this.findMonthForDay(selectedDay, months);
    }

    if (current) {
      return months.find((month) => month.monthIndex === current.monthIndex && month.year === current.year) ?? months[0];
    }

    return months[0];
  }

  private resolveActiveBudgetMonth(current: CalendarMonth, months: CalendarMonth[]): CalendarMonth | null {
    return months.find((month) => month.monthIndex === current.monthIndex && month.year === current.year) ?? null;
  }

  private shiftFocusedMonth(delta: number): void {
    if (!this.focusedMonth || !this.months.length) {
      return;
    }

    const currentIndex = this.findFocusedMonthIndex();

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= this.months.length) {
      return;
    }

    this.focusedMonth = this.months[targetIndex];
    this.selectedDay = null;
  }

  private canShiftFocusedMonth(delta: number): boolean {
    if (!this.focusedMonth || !this.months.length) {
      return false;
    }

    const currentIndex = this.findFocusedMonthIndex();
    if (currentIndex === -1) {
      return false;
    }

    const targetIndex = currentIndex + delta;
    return targetIndex >= 0 && targetIndex < this.months.length;
  }

  private findFocusedMonthIndex(): number {
    return this.months.findIndex(
      (month) => month.monthIndex === this.focusedMonth?.monthIndex && month.year === this.focusedMonth?.year
    );
  }

  private findMonthForDay(day: CalendarDay, months: CalendarMonth[]): CalendarMonth | null {
    return (
      months.find((month) =>
        month.cells.some((cell) => cell.day?.isoDate === day.isoDate)
      ) ?? null
    );
  }

  private buildBudgetCategories(month: CalendarMonth): BudgetCategory[] {
    const variation = (month.monthIndex % 3) * 75;
    return [
      { name: 'Moradia', planned: 1850, committed: 1850 },
      { name: 'Alimentação', planned: 900 + variation, committed: 420 + variation / 2 },
      { name: 'Transporte', planned: 420, committed: 260 },
      { name: 'Lazer', planned: 350 + variation, committed: 120 + variation / 3 },
      { name: 'Educação', planned: 480, committed: 180 },
      { name: 'Reservas', planned: 600, committed: 300 }
    ];
  }
}
