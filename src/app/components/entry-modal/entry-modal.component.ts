import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewTransaction } from '../../models/transaction.model';
import { formatIsoDate } from '../../utils/calendar.utils';

interface EntryForm {
  title: string;
  category: string;
  amount: string;
  type: 'entrada' | 'saida';
  date: string;
  recurrence: string;
}

@Component({
  selector: 'app-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entry-modal.component.html',
  styleUrl: './entry-modal.component.scss'
})
export class EntryModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveEntry = new EventEmitter<NewTransaction>();

  form: EntryForm = this.getInitialForm();

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    const amountValue = Number(this.form.amount);
    if (!this.form.title || !this.form.category || !amountValue || !this.form.date) {
      return;
    }

    const normalizedAmount = this.form.type === 'saida' ? -Math.abs(amountValue) : Math.abs(amountValue);

    this.saveEntry.emit({
      title: this.form.title,
      category: this.form.category,
      amount: normalizedAmount,
      date: this.form.date,
      recurrence: this.form.recurrence,
      type: this.form.type
    });

    this.form = this.getInitialForm();
  }

  private getInitialForm(): EntryForm {
    return {
      title: '',
      category: '',
      amount: '',
      type: 'entrada',
      date: formatIsoDate(new Date()),
      recurrence: 'mensal'
    };
  }
}
