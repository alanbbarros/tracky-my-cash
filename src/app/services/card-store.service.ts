import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card, NewCard } from '../models/card.model';

const STORAGE_KEY = 'tracky-my-cash-cards';

@Injectable({ providedIn: 'root' })
export class CardStoreService {
  private readonly cardsSubject = new BehaviorSubject<Card[]>(this.loadFromStorage());

  readonly cards$ = this.cardsSubject.asObservable();

  getSnapshot(): Card[] {
    return this.cardsSubject.getValue();
  }

  addCard(entry: NewCard): void {
    const card: Card = {
      ...entry,
      id: this.createId()
    };
    const updated = [...this.cardsSubject.getValue(), card];
    this.cardsSubject.next(updated);
    this.saveToStorage(updated);
  }

  updateCard(cardId: string, updates: NewCard): void {
    const updated = this.cardsSubject.getValue().map((card) => (card.id === cardId ? { ...card, ...updates } : card));
    this.cardsSubject.next(updated);
    this.saveToStorage(updated);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private loadFromStorage(): Card[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: this.createId(),
          name: 'Cartão principal',
          limit: 6000,
          closingDay: 8,
          dueDay: 15
        }
      ];
    }

    try {
      const parsed = JSON.parse(raw) as Card[];
      return Array.isArray(parsed) && parsed.length
        ? parsed
        : [
            {
              id: this.createId(),
              name: 'Cartão principal',
              limit: 6000,
              closingDay: 8,
              dueDay: 15
            }
          ];
    } catch {
      return [
        {
          id: this.createId(),
          name: 'Cartão principal',
          limit: 6000,
          closingDay: 8,
          dueDay: 15
        }
      ];
    }
  }

  private saveToStorage(cards: Card[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }
}
