import { Transaction } from './transaction.model';

export interface CalendarDay {
  date: Date;
  isoDate: string;
  income: number;
  expenses: number;
  balance: number;
  transactions: Transaction[];
  incomeCount: number;
  expenseCount: number;
  isToday: boolean;
}

export interface CalendarCell {
  day?: CalendarDay;
  isPlaceholder: boolean;
}

export interface CalendarMonth {
  label: string;
  year: number;
  monthIndex: number;
  cells: CalendarCell[];
}
