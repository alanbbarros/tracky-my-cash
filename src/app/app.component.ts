import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingCycle, CalendarDay } from './models/calendar.model';
import { Card, NewCard } from './models/card.model';
import { NewTransaction, Transaction } from './models/transaction.model';
import { CalendarSectionComponent } from './components/calendar-section/calendar-section.component';
import { DetailsPanelComponent } from './components/details-panel/details-panel.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { TopBarComponent, AppView } from './components/top-bar/top-bar.component';
import { CardsSectionComponent } from './components/cards-section/cards-section.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { TransactionsSectionComponent } from './components/transactions-section/transactions-section.component';
import { CardStoreService } from './services/card-store.service';
import { TransactionStoreService } from './services/transaction-store.service';
import { buildBillingCycles, getCurrentCycle, formatIsoDate } from './utils/calendar.utils';

interface CardCycleSummary {
  card: Card;
  currentCycle: BillingCycle | null;
  usedLimit: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    CalendarSectionComponent,
    DetailsPanelComponent,
    EntryModalComponent,
    CardsSectionComponent,
    TransactionsSectionComponent,
    InvoiceDetailComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);

  cards: Card[] = [];
  transactions: Transaction[] = [];
  cycles: BillingCycle[] = [];
  selectedDay: CalendarDay | null = null;
  focusedCycle: BillingCycle | null = null;
  activeView: AppView = 'calendar';
  activeCard: Card | null = null;
  cardSummaries: CardCycleSummary[] = [];
  editingTransaction: Transaction | null = null;
  transactionFilters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    cardId?: string;
    text?: string;
  } | null = null;
  isModalOpen = false;

  constructor(
    private readonly transactionStore: TransactionStoreService,
    private readonly cardStore: CardStoreService
  ) {
    this.cards = this.cardStore.getSnapshot();
    this.transactions = this.transactionStore.getSnapshot();
    this.syncFromStores();

    this.transactionStore.transactions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((transactions) => {
        this.transactions = transactions;
        this.syncFromStores();
      });

    this.cardStore.cards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cards) => {
        this.cards = cards;
        this.syncFromStores();
      });
  }

  openModal(transaction?: Transaction): void {
    this.editingTransaction = transaction ?? null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingTransaction = null;
  }

  onSelectDay(day: CalendarDay): void {
    if (this.selectedDay?.isoDate === day.isoDate) {
      this.selectedDay = null;
      this.focusedCycle = this.findCycleForDay(day);
      return;
    }

    this.selectedDay = day;
    this.focusedCycle = this.findCycleForDay(day);
  }

  onViewChange(view: AppView): void {
    this.activeView = view;
    this.transactionFilters = null;
  }

  viewCycleTransactions(): void {
    if (!this.focusedCycle || !this.activeCard) {
      return;
    }

    this.transactionFilters = {
      startDate: formatIsoDate(this.focusedCycle.startDate),
      endDate: formatIsoDate(this.focusedCycle.endDate),
      cardId: this.activeCard.id
    };
    this.activeView = 'transactions';
  }

  openInvoiceView(): void {
    this.activeView = 'invoice';
  }

  viewCardInvoice(card: Card): void {
    this.activeCard = card;
    this.cycles = buildBillingCycles(12, card, this.transactions);
    this.focusedCycle = getCurrentCycle(this.cycles);
    this.activeView = 'invoice';
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
    const withGroup = this.attachRecurrenceGroup(entry);
    this.transactionStore.addTransaction(withGroup);
    this.closeModal();
  }

  onUpdateEntry(payload: { id: string; entry: NewTransaction }): void {
    const recurrenceOption = this.resolveRecurrenceEdit(payload.entry);
    if (recurrenceOption === 'cancel') {
      return;
    }

    const entryWithGroup = this.attachRecurrenceGroup(payload.entry);

    if (recurrenceOption === 'single') {
      this.transactionStore.updateTransaction(payload.id, entryWithGroup);
    } else if (recurrenceOption === 'forward') {
      const reference = this.transactions.find((transaction) => transaction.id === payload.id);
      if (!reference) {
        return;
      }
      this.transactionStore.updateTransactionsByFilter(
        (transaction) =>
          transaction.recurrenceGroupId === reference.recurrenceGroupId && transaction.date >= reference.date,
        entryWithGroup
      );
    } else {
      const reference = this.transactions.find((transaction) => transaction.id === payload.id);
      if (!reference) {
        return;
      }
      this.transactionStore.updateTransactionsByFilter(
        (transaction) => transaction.recurrenceGroupId === reference.recurrenceGroupId,
        entryWithGroup
      );
    }

    this.closeModal();
  }

  onDeleteTransaction(transaction: Transaction): void {
    if (transaction.recurrence !== 'nenhuma' && transaction.recurrenceGroupId) {
      const choice = this.resolveRecurrenceDelete();
      if (choice === 'cancel') {
        return;
      }
      if (choice === 'single') {
        this.transactionStore.deleteTransaction(transaction.id);
        return;
      }
      if (choice === 'forward') {
        this.transactionStore.deleteTransactionsByFilter(
          (entry) => entry.recurrenceGroupId === transaction.recurrenceGroupId && entry.date >= transaction.date
        );
        return;
      }
      this.transactionStore.deleteTransactionsByFilter(
        (entry) => entry.recurrenceGroupId === transaction.recurrenceGroupId
      );
      return;
    }

    this.transactionStore.deleteTransaction(transaction.id);
  }

  onSaveCard(entry: NewCard): void {
    this.cardStore.addCard(entry);
  }

  onUpdateCard(payload: { id: string; entry: NewCard }): void {
    this.cardStore.updateCard(payload.id, payload.entry);
  }

  onMarkInvoicePaid(): void {
    if (!this.activeCard || !this.focusedCycle) {
      return;
    }

    if (this.focusedCycle.status === 'paga') {
      return;
    }

    const amount = -Math.abs(this.focusedCycle.creditTotal);
    if (!amount) {
      return;
    }

    this.transactionStore.addTransaction({
      title: `Pagamento fatura ${this.activeCard.name}`,
      category: 'Fatura',
      amount,
      date: formatIsoDate(this.focusedCycle.dueDate),
      recurrence: 'nenhuma',
      type: 'saida',
      paymentMethod: 'debito',
      isInvoicePayment: true,
      invoiceCycleId: this.focusedCycle.id
    });
  }

  private syncFromStores(): void {
    this.activeCard = this.cards.find((card) => card.id === this.activeCard?.id) ?? this.cards[0] ?? null;
    if (!this.activeCard) {
      this.cycles = [];
      this.focusedCycle = null;
      return;
    }

    this.cycles = buildBillingCycles(12, this.activeCard, this.transactions);
    this.focusedCycle = this.resolveFocusedCycle(this.focusedCycle, this.cycles, this.selectedDay);
    this.selectedDay = this.resolveSelectedDay(this.selectedDay, this.cycles);
    this.cardSummaries = this.cards.map((card) => {
      const cycles = buildBillingCycles(6, card, this.transactions);
      const currentCycle = getCurrentCycle(cycles);
      return {
        card,
        currentCycle,
        usedLimit: currentCycle?.creditTotal ?? 0
      };
    });
  }

  private resolveSelectedDay(current: CalendarDay | null, cycles: BillingCycle[]): CalendarDay | null {
    if (!cycles.length || !current) {
      return null;
    }

    const targetIso = current.isoDate;
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

  private findFocusedCycleIndex(): number {
    if (!this.focusedCycle) {
      return -1;
    }

    return this.cycles.findIndex((cycle) => cycle.id === this.focusedCycle?.id);
  }

  private findCycleForDay(day: CalendarDay, cycles: BillingCycle[] = this.cycles): BillingCycle | null {
    return cycles.find((cycle) => cycle.cells.some((cell) => cell.day?.isoDate === day.isoDate)) ?? null;
  }

  private resolveRecurrenceEdit(entry: NewTransaction): 'single' | 'forward' | 'all' | 'cancel' {
    if (entry.recurrence === 'nenhuma' || !entry.recurrenceGroupId) {
      return 'single';
    }

    const response = window.prompt(
      'Editar recorrência?\n1 - Apenas este\n2 - Este e os próximos\n3 - Toda a série',
      '1'
    );

    if (!response) {
      return 'cancel';
    }

    if (response.trim() === '2') {
      return 'forward';
    }

    if (response.trim() === '3') {
      return 'all';
    }

    return 'single';
  }

  private resolveRecurrenceDelete(): 'single' | 'forward' | 'all' | 'cancel' {
    const response = window.prompt(
      'Excluir recorrência?\n1 - Apenas este\n2 - Este e os próximos\n3 - Toda a série',
      '1'
    );

    if (!response) {
      return 'cancel';
    }

    if (response.trim() === '2') {
      return 'forward';
    }

    if (response.trim() === '3') {
      return 'all';
    }

    return 'single';
  }

  private attachRecurrenceGroup(entry: NewTransaction): NewTransaction {
    if (entry.recurrence === 'nenhuma') {
      return { ...entry, recurrenceGroupId: undefined };
    }

    return {
      ...entry,
      recurrenceGroupId: entry.recurrenceGroupId ?? `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`
    };
  }
}
