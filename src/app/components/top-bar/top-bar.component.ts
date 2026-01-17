import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle } from '../../models/calendar.model';

export type AppView = 'calendar' | 'cards' | 'transactions' | 'invoice';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  @Input() focusedCycle: BillingCycle | null = null;
  @Input() canNavigatePrevious = false;
  @Input() canNavigateNext = false;
  @Input() activeView: AppView = 'calendar';
  @Output() navigatePrevious = new EventEmitter<void>();
  @Output() navigateNext = new EventEmitter<void>();
  @Output() openNewEntry = new EventEmitter<void>();
  @Output() viewChange = new EventEmitter<AppView>();
}
