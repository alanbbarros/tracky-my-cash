import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingCycle } from '../../models/calendar.model';
import { CreditCard } from '../../models/card.model';
import { CurrencyFormatService } from '../../services/currency-format.service';
import { NotificationService } from '../../services/notification.service';

export interface CardOverview {
  card: CreditCard;
  currentCycle: BillingCycle | null;
  usedLimit: number;
  usedPercent: number;
}

interface CardForm {
  name: string;
  limit: string;
  closingDay: string;
  dueDay: string;
}

@Component({
  selector: 'app-card-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-management.component.html',
  styleUrl: './card-management.component.scss'
})
export class CardManagementComponent {
  @Input() cardOverviews: CardOverview[] = [];
  @Input() activeCardId: string | null = null;
  @Output() selectCard = new EventEmitter<CreditCard>();
  @Output() saveCard = new EventEmitter<{ card: CreditCard; isEdit: boolean }>();
  @Output() openInvoice = new EventEmitter<BillingCycle>();

  form: CardForm = this.createInitialForm();
  editingCardId: string | null = null;
  isModalOpen = false;

  constructor(
    private readonly currencyFormat: CurrencyFormatService,
    private readonly notificationService: NotificationService
  ) {}

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  openNewCard(): void {
    this.editingCardId = null;
    this.form = this.createInitialForm();
    this.isModalOpen = true;
  }

  startEdit(card: CreditCard): void {
    this.editingCardId = card.id;
    this.form = {
      name: card.name,
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString()
    };
    this.isModalOpen = true;
  }

  resetForm(): void {
    this.editingCardId = null;
    this.form = this.createInitialForm();
    this.isModalOpen = false;
  }

  submitForm(): void {
    if (!this.form.name || !this.form.limit || !this.form.closingDay || !this.form.dueDay) {
      this.notificationService.notify('warning', 'Preencha todos os campos do cartão.');
      return;
    }
    const payload: CreditCard = {
      id: this.editingCardId ?? '',
      name: this.form.name,
      limit: Number(this.form.limit),
      closingDay: Number(this.form.closingDay),
      dueDay: Number(this.form.dueDay)
    };
    this.saveCard.emit({ card: payload, isEdit: Boolean(this.editingCardId) });
    this.resetForm();
  }

  private createInitialForm(): CardForm {
    return {
      name: '',
      limit: '',
      closingDay: '',
      dueDay: ''
    };
  }
}
