import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CreditCard } from '../models/card.model';

const STORAGE_KEY = 'tracky-my-cash-cards';

@Injectable({ providedIn: 'root' })
export class CardStoreService {
  private readonly cardsSubject = new BehaviorSubject<CreditCard[]>(this.loadFromStorage());

  readonly cards$ = this.cardsSubject.asObservable();

  getSnapshot(): CreditCard[] {
    return this.cardsSubject.getValue();
  }

  addCard(card: Omit<CreditCard, 'id'>): CreditCard {
    const newCard: CreditCard = {
      ...card,
      id: this.createId()
    };
    const updated = [...this.cardsSubject.getValue(), newCard];
    this.cardsSubject.next(updated);
    this.saveToStorage(updated);
    return newCard;
  }

  updateCard(updatedCard: CreditCard): void {
    const updated = this.cardsSubject.getValue().map((card) => (card.id === updatedCard.id ? updatedCard : card));
    this.cardsSubject.next(updated);
    this.saveToStorage(updated);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private loadFromStorage(): CreditCard[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: this.createId(),
          name: 'Cartão principal',
          limit: 4800,
          closingDay: 8,
          dueDay: 15
        }
      ];
    }

    try {
      const parsed = JSON.parse(raw) as CreditCard[];
      return Array.isArray(parsed) && parsed.length ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(cards: CreditCard[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }
}
