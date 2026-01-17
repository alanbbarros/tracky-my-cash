import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle } from '../../models/calendar.model';

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
  @Input() activeView: 'calendar' | 'cards' | 'transactions' | 'invoice' = 'calendar';
  @Output() navigatePrevious = new EventEmitter<void>();
  @Output() navigateNext = new EventEmitter<void>();
  @Output() openNewEntry = new EventEmitter<void>();
  @Output() openView = new EventEmitter<'calendar' | 'cards' | 'transactions' | 'invoice'>();
}
