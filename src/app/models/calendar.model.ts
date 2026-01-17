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
  isInCycle: boolean;
}

export interface BillingCycle {
  id: string;
  label: string;
  cycleStart: Date;
  cycleEnd: Date;
  dueDate: Date;
  cycleRangeLabel: string;
  dueDateLabel: string;
  startBalance: number;
  endBalance: number;
  incomeTotal: number;
  expensesTotal: number;
  budgetConfigured: boolean;
  cells: CalendarCell[];
}
