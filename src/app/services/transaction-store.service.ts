import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NewTransaction, Transaction } from '../models/transaction.model';

const STORAGE_KEY = 'tracky-my-cash-transactions';

@Injectable({ providedIn: 'root' })
export class TransactionStoreService {
  private readonly transactionsSubject = new BehaviorSubject<Transaction[]>(this.loadFromStorage());

  readonly transactions$ = this.transactionsSubject.asObservable();

  getSnapshot(): Transaction[] {
    return this.transactionsSubject.getValue();
  }

  addTransaction(entry: NewTransaction): void {
    const transaction: Transaction = {
      ...entry,
      id: this.createId(),
      recurrenceGroupId: entry.recurrence !== 'nenhuma' ? entry.recurrenceGroupId ?? this.createId() : undefined
    };
    const updated = [...this.transactionsSubject.getValue(), transaction];
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  updateTransaction(id: string, entry: NewTransaction): void {
    const updated = this.transactionsSubject
      .getValue()
      .map((transaction) => {
        if (transaction.id !== id) {
          return transaction;
        }
        const recurrenceGroupId =
          entry.recurrence !== 'nenhuma' ? entry.recurrenceGroupId ?? transaction.recurrenceGroupId ?? this.createId() : undefined;
        return { ...transaction, ...entry, id, recurrenceGroupId };
      });
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  updateTransactions(updater: (transactions: Transaction[]) => Transaction[]): void {
    const updated = updater(this.transactionsSubject.getValue());
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  deleteTransaction(id: string): void {
    const updated = this.transactionsSubject.getValue().filter((transaction) => transaction.id !== id);
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private loadFromStorage(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Transaction[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((transaction) => ({
        ...transaction,
        type: transaction.type ?? (transaction.amount >= 0 ? 'entrada' : 'saida'),
        recurrence:
          transaction.recurrence === 'semanal' ||
          transaction.recurrence === 'mensal' ||
          transaction.recurrence === 'anual' ||
          transaction.recurrence === 'nenhuma'
            ? transaction.recurrence
            : 'nenhuma',
        paymentMethod: transaction.paymentMethod ?? 'debito'
      }));
    } catch {
      return [];
    }
  }

  private saveToStorage(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}
