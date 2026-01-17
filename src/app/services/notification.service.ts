import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);

  readonly notifications$ = this.notificationsSubject.asObservable();

  notify(type: NotificationType, message: string, timeoutMs = 4000): void {
    const id = this.createId();
    const next = [...this.notificationsSubject.getValue(), { id, type, message }];
    this.notificationsSubject.next(next);

    if (timeoutMs > 0) {
      window.setTimeout(() => this.dismiss(id), timeoutMs);
    }
  }

  dismiss(id: string): void {
    this.notificationsSubject.next(this.notificationsSubject.getValue().filter((item) => item.id !== id));
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
