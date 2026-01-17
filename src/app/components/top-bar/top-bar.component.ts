import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarMonth } from '../../models/calendar.model';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  @Input() focusedMonth: CalendarMonth | null = null;
  @Input() canNavigatePrevious = false;
  @Input() canNavigateNext = false;
  @Output() navigatePrevious = new EventEmitter<void>();
  @Output() navigateNext = new EventEmitter<void>();
  @Output() openNewEntry = new EventEmitter<void>();
}
