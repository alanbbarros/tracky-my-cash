import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingCycle, CalendarDay } from './models/calendar.model';
import { CreditCard } from './models/card.model';
import { NewTransaction, Transaction, TransactionFilters } from './models/transaction.model';
import { CalendarSectionComponent } from './components/calendar-section/calendar-section.component';
import { DetailsPanelComponent } from './components/details-panel/details-panel.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { CardManagementComponent } from './components/card-management/card-management.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { TransactionsListComponent } from './components/transactions-list/transactions-list.component';
import { CardStoreService } from './services/card-store.service';
import { TransactionStoreService } from './services/transaction-store.service';
import { buildBillingCycles, formatIsoDate } from './utils/calendar.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    CalendarSectionComponent,
    DetailsPanelComponent,
    EntryModalComponent,
    CardManagementComponent,
    TransactionsListComponent,
    InvoiceDetailComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);

  cycles: BillingCycle[] = [];
  selectedDay: CalendarDay | null = null;
  focusedCycle: BillingCycle | null = null;
  activeInvoiceCycle: BillingCycle | null = null;
  isModalOpen = false;
  activeView: 'calendar' | 'cards' | 'transactions' | 'invoice' = 'calendar';
  userName = 'Larissa';
  cards: CreditCard[] = [];
  activeCard: CreditCard | null = null;
  transactions: Transaction[] = [];
  editingTransaction: Transaction | null = null;
  recurrenceEditTarget: Transaction | null = null;
  recurrenceEditScope: 'single' | 'next' | 'all' = 'single';
  transactionFilters: TransactionFilters = {};

  constructor(
    private readonly transactionStore: TransactionStoreService,
    private readonly cardStore: CardStoreService
  ) {
    this.cards = this.cardStore.getSnapshot();
    this.activeCard = this.cards[0] ?? null;
    this.transactions = this.transactionStore.getSnapshot();
    this.syncFromData();

    this.transactionStore.transactions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((transactions) => {
        this.transactions = transactions;
        this.syncFromData();
      });

    this.cardStore.cards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cards) => {
        this.cards = cards;
        if (!this.activeCard && cards.length) {
          this.activeCard = cards[0];
        }
        if (this.activeCard && !cards.some((card) => card.id === this.activeCard?.id)) {
          this.activeCard = cards[0] ?? null;
        }
        this.syncFromData();
      });
  }

  openModal(): void {
    this.editingTransaction = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingTransaction = null;
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

  openView(view: 'calendar' | 'cards' | 'transactions' | 'invoice'): void {
    this.activeView = view;
  }

  openInvoiceDetail(cycle: BillingCycle | null = this.focusedCycle): void {
    if (!cycle) {
      return;
    }
    const card = this.cards.find((item) => item.id === cycle.cardId);
    if (card) {
      this.activeCard = card;
    }
    this.activeInvoiceCycle = cycle;
    this.activeView = 'invoice';
  }

  openTransactions(filters?: TransactionFilters): void {
    this.transactionFilters = filters ?? {};
    this.activeView = 'transactions';
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

  onUpdateEntry(entry: NewTransaction): void {
    if (!this.editingTransaction) {
      return;
    }

    const target = this.editingTransaction;
    if (this.recurrenceEditScope === 'single' || !target.recurrenceGroupId) {
      this.transactionStore.updateTransaction(target.id, entry);
      this.closeModal();
      return;
    }

    const groupId = target.recurrenceGroupId;
    const anchorDate = target.date;
    this.transactionStore.updateTransactions((transactions) =>
      transactions.map((transaction) => {
        if (transaction.recurrenceGroupId !== groupId) {
          return transaction;
        }
        if (this.recurrenceEditScope === 'next' && transaction.date < anchorDate) {
          return transaction;
        }
        return {
          ...transaction,
          ...entry,
          id: transaction.id,
          recurrenceGroupId: entry.recurrence !== 'nenhuma' ? groupId : undefined
        };
      })
    );
    this.closeModal();
  }

  onDeleteTransaction(transaction: Transaction): void {
    this.transactionStore.deleteTransaction(transaction.id);
  }

  onEditTransaction(transaction: Transaction): void {
    if (transaction.recurrence !== 'nenhuma' && transaction.recurrenceGroupId) {
      this.recurrenceEditTarget = transaction;
      return;
    }
    this.editingTransaction = transaction;
    this.isModalOpen = true;
  }

  onSelectRecurrenceEdit(scope: 'single' | 'next' | 'all'): void {
    if (!this.recurrenceEditTarget) {
      return;
    }
    this.recurrenceEditScope = scope;
    this.editingTransaction = this.recurrenceEditTarget;
    this.recurrenceEditTarget = null;
    this.isModalOpen = true;
  }

  onCancelRecurrenceEdit(): void {
    this.recurrenceEditTarget = null;
  }

  onSelectCard(card: CreditCard): void {
    this.activeCard = card;
    this.syncFromData();
  }

  onSaveCard(card: CreditCard, isEdit: boolean): void {
    if (isEdit) {
      this.cardStore.updateCard(card);
      return;
    }
    const created = this.cardStore.addCard({
      name: card.name,
      limit: card.limit,
      closingDay: card.closingDay,
      dueDay: card.dueDay
    });
    this.activeCard = created;
  }

  onMarkInvoiceAsPaid(cycle: BillingCycle): void {
    if (!this.activeCard) {
      return;
    }
    const total = this.getInvoiceTotal(cycle);
    if (!total) {
      return;
    }
    const invoiceId = this.getInvoiceId(cycle);
    const hasPayment = this.transactions.some((transaction) => transaction.invoiceId === invoiceId);
    if (hasPayment) {
      return;
    }
    const paymentTransaction: NewTransaction = {
      title: `Pagamento fatura ${this.activeCard.name}`,
      category: 'Fatura',
      amount: -Math.abs(total),
      date: formatIsoDate(cycle.dueDate),
      recurrence: 'nenhuma',
      type: 'saida',
      paymentMethod: 'debito',
      cardId: this.activeCard.id,
      invoiceId
    };
    this.transactionStore.addTransaction(paymentTransaction);
  }

  get invoiceStatus(): 'aberta' | 'fechada' | 'paga' {
    if (!this.activeInvoiceCycle) {
      return 'aberta';
    }
    const invoiceId = this.getInvoiceId(this.activeInvoiceCycle);
    const hasPayment = this.transactions.some((transaction) => transaction.invoiceId === invoiceId);
    if (hasPayment) {
      return 'paga';
    }
    const today = new Date();
    if (today > this.activeInvoiceCycle.cycleEnd) {
      return 'fechada';
    }
    return 'aberta';
  }

  get filteredTransactions(): Transaction[] {
    const { startDate, endDate, category, cardId, text } = this.transactionFilters;
    return this.transactions
      .filter((transaction) => {
      if (startDate && transaction.date < startDate) {
        return false;
      }
      if (endDate && transaction.date > endDate) {
        return false;
      }
      if (category && transaction.category !== category) {
        return false;
      }
      if (cardId && transaction.cardId !== cardId) {
        return false;
      }
      if (text && !transaction.title.toLowerCase().includes(text.toLowerCase())) {
        return false;
      }
      return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  get activeInvoiceTransactions(): Transaction[] {
    if (!this.activeInvoiceCycle) {
      return [];
    }
    return this.getInvoiceTransactions(this.activeInvoiceCycle);
  }

  get cardOverviews(): Array<{
    card: CreditCard;
    currentCycle: BillingCycle | null;
    usedLimit: number;
    usedPercent: number;
  }> {
    return this.cards.map((card) => {
      const cycle = buildBillingCycles(1, this.transactions, card)[0] ?? null;
      const usedLimit = cycle ? this.getInvoiceTotal(cycle, card.id) : 0;
      const usedPercent = card.limit ? Math.min((usedLimit / card.limit) * 100, 100) : 0;
      return {
        card,
        currentCycle: cycle,
        usedLimit,
        usedPercent
      };
    });
  }

  private syncFromData(): void {
    if (!this.activeCard) {
      this.cycles = [];
      this.selectedDay = null;
      this.focusedCycle = null;
      return;
    }
    this.cycles = buildBillingCycles(20, this.transactions, this.activeCard);
    this.selectedDay = this.resolveSelectedDay(this.selectedDay, this.cycles);
    this.focusedCycle = this.resolveFocusedCycle(this.focusedCycle, this.cycles, this.selectedDay);
    if (this.activeInvoiceCycle) {
      this.activeInvoiceCycle =
        this.cycles.find((cycle) => cycle.cycleEnd.getTime() === this.activeInvoiceCycle?.cycleEnd.getTime()) ?? null;
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
      return cycles.find((cycle) => cycle.cycleEnd.getTime() === current.cycleEnd.getTime()) ?? cycles[0];
    }

    return cycles[0];
  }

  private findFocusedCycleIndex(): number {
    if (!this.focusedCycle) {
      return -1;
    }

    return this.cycles.findIndex((cycle) => cycle.cycleEnd.getTime() === this.focusedCycle?.cycleEnd.getTime());
  }

  private findCycleForDay(day: CalendarDay, cycles: BillingCycle[]): BillingCycle | null {
    return (
      cycles.find((cycle) =>
        cycle.cells.some((cell) => cell.day?.isoDate === day.isoDate)
      ) ?? null
    );
  }

  private getInvoiceTransactions(cycle: BillingCycle): Transaction[] {
    return this.transactions
      .filter((transaction) => {
        if (transaction.paymentMethod !== 'credito') {
          return false;
        }
        if (transaction.cardId !== cycle.cardId) {
          return false;
        }
        return transaction.date >= formatIsoDate(cycle.cycleStart) && transaction.date <= formatIsoDate(cycle.cycleEnd);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getInvoiceTotal(cycle: BillingCycle, cardId?: string): number {
    const total = this.transactions
      .filter((transaction) => {
        if (transaction.paymentMethod !== 'credito') {
          return false;
        }
        if (cardId && transaction.cardId !== cardId) {
          return false;
        }
        return transaction.date >= formatIsoDate(cycle.cycleStart) && transaction.date <= formatIsoDate(cycle.cycleEnd);
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    return total;
  }

  private getInvoiceId(cycle: BillingCycle): string {
    return `${cycle.cardId}-${formatIsoDate(cycle.cycleStart)}-${formatIsoDate(cycle.cycleEnd)}`;
  }
}
