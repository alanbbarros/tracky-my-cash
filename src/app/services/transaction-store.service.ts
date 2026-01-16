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
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}
