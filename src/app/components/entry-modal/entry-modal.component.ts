import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from '../../models/card.model';
import { NewTransaction, PaymentMethod, RecurrenceType, Transaction, TransactionType } from '../../models/transaction.model';
import { formatIsoDate } from '../../utils/calendar.utils';

interface EntryForm {
  title: string;
  category: string;
  amount: string;
  type: TransactionType;
  date: string;
  recurrence: RecurrenceType;
  recurrenceGroupId?: string;
  paymentMethod: PaymentMethod;
  cardId: string;
  installmentTotal: string;
  installmentCurrent: string;
}

@Component({
  selector: 'app-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entry-modal.component.html',
  styleUrl: './entry-modal.component.scss'
})
export class EntryModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() cards: Card[] = [];
  @Input() transactionToEdit: Transaction | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveEntry = new EventEmitter<NewTransaction>();
  @Output() updateEntry = new EventEmitter<{ id: string; entry: NewTransaction }>();

  form: EntryForm = this.getInitialForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit'] && this.transactionToEdit) {
      this.form = this.getFormFromTransaction(this.transactionToEdit);
    }
  }

  onClose(): void {
    this.form = this.getInitialForm();
    this.closeModal.emit();
  }

  onSubmit(): void {
    const amountValue = Number(this.form.amount);
    const installmentTotalValue = Number(this.form.installmentTotal);
    const installmentCurrentValue = Number(this.form.installmentCurrent);

    if (!this.form.title || !this.form.category || !amountValue || !this.form.date) {
      return;
    }

    const normalizedAmount = this.form.type === 'saida' ? -Math.abs(amountValue) : Math.abs(amountValue);
    const installment =
      this.form.paymentMethod === 'credito' && installmentTotalValue > 1
        ? {
            total: installmentTotalValue,
            current: Math.min(Math.max(installmentCurrentValue || 1, 1), installmentTotalValue)
          }
        : undefined;

    const entry: NewTransaction = {
      title: this.form.title,
      category: this.form.category,
      amount: normalizedAmount,
      date: this.form.date,
      recurrence: this.form.recurrence,
      recurrenceGroupId: this.form.recurrenceGroupId,
      type: this.form.type,
      paymentMethod: this.form.paymentMethod,
      cardId: this.form.paymentMethod === 'credito' ? this.form.cardId : undefined,
      installment
    };

    if (this.transactionToEdit) {
      this.updateEntry.emit({ id: this.transactionToEdit.id, entry });
    } else {
      this.saveEntry.emit(entry);
    }

    this.form = this.getInitialForm();
  }

  private getFormFromTransaction(transaction: Transaction): EntryForm {
    return {
      title: transaction.title,
      category: transaction.category,
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      date: transaction.date,
      recurrence: transaction.recurrence,
      recurrenceGroupId: transaction.recurrenceGroupId,
      paymentMethod: transaction.paymentMethod,
      cardId: transaction.cardId ?? this.cards[0]?.id ?? '',
      installmentTotal: transaction.installment ? String(transaction.installment.total) : '1',
      installmentCurrent: transaction.installment ? String(transaction.installment.current) : '1'
    };
  }

  private getInitialForm(): EntryForm {
    return {
      title: '',
      category: '',
      amount: '',
      type: 'entrada',
      date: formatIsoDate(new Date()),
      recurrence: 'nenhuma',
      recurrenceGroupId: undefined,
      paymentMethod: 'debito',
      cardId: this.cards[0]?.id ?? '',
      installmentTotal: '1',
      installmentCurrent: '1'
    };
  }
}
