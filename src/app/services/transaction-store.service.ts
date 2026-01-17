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
      id: this.createId()
    };
    const updated = [...this.transactionsSubject.getValue(), transaction];
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  updateTransaction(transactionId: string, updates: NewTransaction): void {
    const updated = this.transactionsSubject.getValue().map((transaction) =>
      transaction.id === transactionId ? { ...transaction, ...updates } : transaction
    );
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  updateTransactionsByFilter(filter: (transaction: Transaction) => boolean, updates: NewTransaction): void {
    const updated = this.transactionsSubject.getValue().map((transaction) =>
      filter(transaction) ? { ...transaction, ...updates } : transaction
    );
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  deleteTransaction(transactionId: string): void {
    const updated = this.transactionsSubject.getValue().filter((transaction) => transaction.id !== transactionId);
    this.transactionsSubject.next(updated);
    this.saveToStorage(updated);
  }

  deleteTransactionsByFilter(filter: (transaction: Transaction) => boolean): void {
    const updated = this.transactionsSubject.getValue().filter((transaction) => !filter(transaction));
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
        recurrence: transaction.recurrence ?? 'nenhuma',
        type: transaction.type ?? (transaction.amount < 0 ? 'saida' : 'entrada'),
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
