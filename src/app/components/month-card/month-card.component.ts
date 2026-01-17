import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle, CalendarDay } from '../../models/calendar.model';
import { DayCellComponent } from '../day-cell/day-cell.component';

@Component({
  selector: 'app-month-card',
  standalone: true,
  imports: [CommonModule, DayCellComponent],
  templateUrl: './month-card.component.html',
  styleUrl: './month-card.component.scss'
})
export class MonthCardComponent {
  @Input({ required: true }) cycle!: BillingCycle;
  @Input() selectedDay: CalendarDay | null = null;
  @Output() daySelect = new EventEmitter<CalendarDay>();
}
