import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingCycle, CalendarDay } from './models/calendar.model';
import { BudgetCategory } from './models/budget.model';
import { NewTransaction, Transaction } from './models/transaction.model';
import { CalendarSectionComponent } from './components/calendar-section/calendar-section.component';
import { DetailsPanelComponent } from './components/details-panel/details-panel.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { MonthlyBudgetComponent } from './components/monthly-budget/monthly-budget.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { TransactionStoreService } from './services/transaction-store.service';
import { buildBillingCycles } from './utils/calendar.utils';

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

  cycles: BillingCycle[] = [];
  selectedDay: CalendarDay | null = null;
  focusedCycle: BillingCycle | null = null;
  activeBudgetCycle: BillingCycle | null = null;
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
      this.focusedCycle = this.findCycleForDay(day, this.cycles);
      return;
    }

    this.selectedDay = day;
    this.focusedCycle = this.findCycleForDay(day, this.cycles);
  }

  openBudget(cycle: BillingCycle): void {
    this.activeBudgetCycle = cycle;
    this.budgetCategories = this.buildBudgetCategories(cycle);
  }

  closeBudget(): void {
    this.activeBudgetCycle = null;
  }

  get canNavigatePrevious(): boolean {
    const index = this.findFocusedCycleIndex();
    return index > 0;
  }

  get canNavigateNext(): boolean {
    const index = this.findFocusedCycleIndex();
    return index > -1 && index < this.cycles.length - 1;
  }

  onPreviousCycle(): void {
    const index = this.findFocusedCycleIndex();
    if (index > 0) {
      this.focusedCycle = this.cycles[index - 1];
      this.selectedDay = null;
    }
  }

  onNextCycle(): void {
    const index = this.findFocusedCycleIndex();
    if (index > -1 && index < this.cycles.length - 1) {
      this.focusedCycle = this.cycles[index + 1];
      this.selectedDay = null;
    }
  }

  onSaveEntry(entry: NewTransaction): void {
    this.transactionStore.addTransaction(entry);
    this.closeModal();
  }

  private syncFromTransactions(transactions: Transaction[]): void {
    this.cycles = buildBillingCycles(20, transactions);
    this.selectedDay = this.resolveSelectedDay(this.selectedDay, this.cycles);
    this.focusedCycle = this.resolveFocusedCycle(this.focusedCycle, this.cycles, this.selectedDay);
    if (this.activeBudgetCycle) {
      this.activeBudgetCycle = this.resolveActiveBudgetCycle(this.activeBudgetCycle, this.cycles);
      if (this.activeBudgetCycle) {
        this.budgetCategories = this.buildBudgetCategories(this.activeBudgetCycle);
      }
    }
  }

  private resolveSelectedDay(current: CalendarDay | null, cycles: BillingCycle[]): CalendarDay | null {
    if (!cycles.length) {
      return null;
    }

    if (!current) {
      return null;
    }

    const targetIso = current?.isoDate;
    if (targetIso) {
      for (const cycle of cycles) {
        for (const cell of cycle.cells) {
          if (cell.day?.isoDate === targetIso) {
            return cell.day;
          }
        }
      }
    }

    return null;
  }

  private resolveFocusedCycle(
    current: BillingCycle | null,
    cycles: BillingCycle[],
    selectedDay: CalendarDay | null
  ): BillingCycle | null {
    if (!cycles.length) {
      return null;
    }

    if (selectedDay) {
      return this.findCycleForDay(selectedDay, cycles);
    }

    if (current) {
      return cycles.find((cycle) => cycle.id === current.id) ?? cycles[0];
    }

    return cycles[0];
  }

  private resolveActiveBudgetCycle(current: BillingCycle, cycles: BillingCycle[]): BillingCycle | null {
    return cycles.find((cycle) => cycle.id === current.id) ?? null;
  }

  private findFocusedCycleIndex(): number {
    if (!this.focusedCycle) {
      return -1;
    }

    return this.cycles.findIndex((cycle) => cycle.id === this.focusedCycle?.id);
  }

  private findCycleForDay(day: CalendarDay, cycles: BillingCycle[]): BillingCycle | null {
    return (
      cycles.find((cycle) =>
        cycle.cells.some((cell) => cell.day?.isoDate === day.isoDate && cell.isInCycle)
      ) ?? null
    );
  }

  private buildBudgetCategories(cycle: BillingCycle): BudgetCategory[] {
    const variation = (cycle.cycleStart.getMonth() % 3) * 75;
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
