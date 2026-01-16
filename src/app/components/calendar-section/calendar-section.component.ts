import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarMonth, CalendarDay } from '../../models/calendar.model';
import { MonthCardComponent } from '../month-card/month-card.component';

@Component({
  selector: 'app-calendar-section',
  standalone: true,
  imports: [CommonModule, MonthCardComponent],
  templateUrl: './calendar-section.component.html',
  styleUrl: './calendar-section.component.scss'
})
export class CalendarSectionComponent {
  @Input({ required: true }) months: CalendarMonth[] = [];
  @Output() dayHover = new EventEmitter<CalendarDay>();
}
