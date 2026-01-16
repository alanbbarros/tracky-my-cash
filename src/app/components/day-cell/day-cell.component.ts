import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarCell, CalendarDay } from '../../models/calendar.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-day-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './day-cell.component.html',
  styleUrl: './day-cell.component.scss'
})
export class DayCellComponent {
  @Input({ required: true }) cell!: CalendarCell;
  @Output() dayHover = new EventEmitter<CalendarDay>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }
}
