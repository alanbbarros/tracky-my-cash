import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingCycle } from '../../models/calendar.model';
import { Card, NewCard } from '../../models/card.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

interface CardForm {
  name: string;
  limit: string;
  closingDay: string;
  dueDay: string;
}

interface CardSummary {
  card: Card;
  currentCycle: BillingCycle | null;
  usedLimit: number;
}

@Component({
  selector: 'app-cards-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cards-section.component.html',
  styleUrl: './cards-section.component.scss'
})
export class CardsSectionComponent {
  @Input() cards: Card[] = [];
  @Input() cycleSummaries: CardSummary[] = [];
  @Output() saveCard = new EventEmitter<NewCard>();
  @Output() updateCard = new EventEmitter<{ id: string; entry: NewCard }>();
  @Output() viewCurrentInvoice = new EventEmitter<Card>();

  isFormOpen = false;
  editingCard: Card | null = null;
  form: CardForm = this.getInitialForm();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  openCreate(): void {
    this.isFormOpen = true;
    this.editingCard = null;
    this.form = this.getInitialForm();
  }

  openEdit(card: Card): void {
    this.isFormOpen = true;
    this.editingCard = card;
    this.form = {
      name: card.name,
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString()
    };
  }

  cancelForm(): void {
    this.isFormOpen = false;
    this.editingCard = null;
  }

  submitForm(): void {
    const limit = Number(this.form.limit);
    const closingDay = Number(this.form.closingDay);
    const dueDay = Number(this.form.dueDay);

    if (!this.form.name || !limit || !closingDay || !dueDay) {
      return;
    }

    const entry: NewCard = {
      name: this.form.name,
      limit,
      closingDay,
      dueDay
    };

    if (this.editingCard) {
      this.updateCard.emit({ id: this.editingCard.id, entry });
    } else {
      this.saveCard.emit(entry);
    }

    this.cancelForm();
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  private getInitialForm(): CardForm {
    return {
      name: '',
      limit: '',
      closingDay: '8',
      dueDay: '15'
    };
  }
}
