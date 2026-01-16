import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarDay, CalendarMonth } from './models/calendar.model';
import { NewTransaction, Transaction } from './models/transaction.model';
import { CalendarSectionComponent } from './components/calendar-section/calendar-section.component';
import { DetailsPanelComponent } from './components/details-panel/details-panel.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { SummaryCard, SummarySectionComponent } from './components/summary-section/summary-section.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { CurrencyFormatService } from './services/currency-format.service';
import { TransactionStoreService } from './services/transaction-store.service';
import { buildCalendarMonths } from './utils/calendar.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TopBarComponent,
    SummarySectionComponent,
    CalendarSectionComponent,
    DetailsPanelComponent,
    EntryModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);

  months: CalendarMonth[] = [];
  selectedDay: CalendarDay | null = null;
  isModalOpen = false;
  summaryCards: SummaryCard[] = [];

  constructor(
    private readonly transactionStore: TransactionStoreService,
    private readonly currencyFormat: CurrencyFormatService
  ) {
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

  onHoverDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  onSaveEntry(entry: NewTransaction): void {
    this.transactionStore.addTransaction(entry);
    this.closeModal();
  }

  private syncFromTransactions(transactions: Transaction[]): void {
    this.months = buildCalendarMonths(20, transactions);
    this.selectedDay = this.resolveSelectedDay(this.selectedDay, this.months);
    this.summaryCards = this.buildSummary(transactions);
  }

  private buildSummary(transactions: Transaction[]): SummaryCard[] {
    const incomeTotal = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expensesTotal = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    const projectedBalance = this.selectedDay ? this.selectedDay.balance : 0;

    return [
      {
        title: 'Saldo projetado hoje',
        value: this.selectedDay ? this.currencyFormat.format(projectedBalance) : '—',
        meta: 'Baseado nos lançamentos cadastrados.'
      },
      {
        title: 'Total de entradas',
        value: this.currencyFormat.format(incomeTotal),
        meta: 'Entradas pontuais e recorrentes registradas.'
      },
      {
        title: 'Total de saídas',
        value: this.currencyFormat.format(expensesTotal),
        meta: 'Pagamentos e gastos já cadastrados.',
        tone: 'negative'
      }
    ];
  }

  private resolveSelectedDay(current: CalendarDay | null, months: CalendarMonth[]): CalendarDay | null {
    if (!months.length) {
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

    for (const month of months) {
      const firstDay = month.cells.find((cell) => cell.day)?.day;
      if (firstDay) {
        return firstDay;
      }
    }

    return null;
  }
}
