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

export interface BillingCycle {
  label: string;
  year: number;
  monthIndex: number;
  cycleStart: Date;
  cycleEnd: Date;
  dueDate: Date;
  cardId: string;
  startBalance: number;
  endBalance: number;
  incomeTotal: number;
  expensesTotal: number;
  cells: CalendarCell[];
}
