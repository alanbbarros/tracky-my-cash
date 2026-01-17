import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreditCard } from '../../models/card.model';
import { NewTransaction, Transaction } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';
import { NotificationService } from '../../services/notification.service';
import { formatIsoDate } from '../../utils/calendar.utils';

interface EntryForm {
  title: string;
  category: string;
  amount: string;
  type: 'entrada' | 'saida';
  date: string;
  recurrence: 'nenhuma' | 'semanal' | 'mensal' | 'anual';
  paymentMethod: 'credito' | 'debito' | 'pix';
  cardId: string;
  isInstallment: boolean;
  installmentCurrent: string;
  installmentTotal: string;
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
  @Input() cards: CreditCard[] = [];
  @Input() activeCardId: string | null = null;
  @Input() entryToEdit: Transaction | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveEntry = new EventEmitter<NewTransaction>();
  @Output() updateEntry = new EventEmitter<NewTransaction>();

  form: EntryForm = this.getInitialForm();

  constructor(
    private readonly currencyFormat: CurrencyFormatService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entryToEdit'] && this.entryToEdit) {
      this.form = {
        title: this.entryToEdit.title,
        category: this.entryToEdit.category,
        amount: Math.abs(this.entryToEdit.amount).toString(),
        type: this.entryToEdit.type,
        date: this.entryToEdit.date,
        recurrence: this.entryToEdit.recurrence,
        paymentMethod: this.entryToEdit.paymentMethod,
        cardId: this.entryToEdit.cardId ?? this.activeCardId ?? '',
        isInstallment: Boolean(this.entryToEdit.installment),
        installmentCurrent: this.entryToEdit.installment?.current.toString() ?? '',
        installmentTotal: this.entryToEdit.installment?.total.toString() ?? ''
      };
    }
    if (changes['activeCardId'] && !this.entryToEdit) {
      this.form.cardId = this.activeCardId ?? this.form.cardId;
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    const amountValue = this.parseAmount(this.form.amount);
    if (!this.form.title || !this.form.category || !amountValue || !this.form.date) {
      this.notificationService.notify('warning', 'Preencha título, categoria, data e valor válidos.');
      return;
    }
    if (this.form.paymentMethod === 'credito' && !this.form.cardId) {
      this.notificationService.notify('warning', 'Selecione um cartão para compras no crédito.');
      return;
    }

    const normalizedAmount = this.form.type === 'saida' ? -Math.abs(amountValue) : Math.abs(amountValue);
    const installmentTotal = Number(this.form.installmentTotal);
    const installmentCurrent = Number(this.form.installmentCurrent);
    const installment =
      this.form.isInstallment && installmentTotal > 0 && installmentCurrent > 0
        ? {
            current: installmentCurrent,
            total: installmentTotal
          }
        : undefined;

    const payload: NewTransaction = {
      title: this.form.title,
      category: this.form.category,
      amount: normalizedAmount,
      date: this.form.date,
      recurrence: this.form.recurrence,
      type: this.form.type,
      paymentMethod: this.form.paymentMethod,
      cardId: this.form.paymentMethod === 'credito' ? this.form.cardId : undefined,
      installment
    };

    if (this.entryToEdit) {
      this.updateEntry.emit(payload);
    } else {
      this.saveEntry.emit(payload);
    }

    this.form = this.getInitialForm();
  }

  onPaymentMethodChange(): void {
    if (this.form.paymentMethod !== 'credito') {
      this.form.cardId = '';
      this.form.isInstallment = false;
      this.form.installmentCurrent = '';
      this.form.installmentTotal = '';
    }
  }

  formatAmountOnBlur(): void {
    const amountValue = this.parseAmount(this.form.amount);
    if (!amountValue) {
      return;
    }
    this.form.amount = this.currencyFormat.format(amountValue);
  }

  private parseAmount(value: string): number {
    if (!value) {
      return 0;
    }
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private getInitialForm(): EntryForm {
    return {
      title: '',
      category: '',
      amount: '',
      type: 'entrada',
      date: formatIsoDate(new Date()),
      recurrence: 'nenhuma',
      paymentMethod: 'debito',
      cardId: this.activeCardId ?? '',
      isInstallment: false,
      installmentCurrent: '',
      installmentTotal: ''
    };
  }
}
