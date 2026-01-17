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
  id: string;
  label: string;
  periodLabel: string;
  dueDate: Date;
  startDate: Date;
  endDate: Date;
  startBalance: number;
  endBalance: number;
  incomeTotal: number;
  expensesTotal: number;
  creditTotal: number;
  creditCount: number;
  status: 'aberta' | 'fechada' | 'paga';
  cells: CalendarCell[];
}
