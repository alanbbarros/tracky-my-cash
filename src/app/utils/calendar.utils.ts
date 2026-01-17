import { BillingCycle, CalendarCell } from '../models/calendar.model';
import { CreditCard } from '../models/card.model';
import { Transaction } from '../models/transaction.model';

export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const groupTransactionsByDay = (transactions: Transaction[]): Map<string, Transaction[]> => {
  const grouped = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const list = grouped.get(transaction.date) ?? [];
    list.push(transaction);
    grouped.set(transaction.date, list);
  }

  return grouped;
};

const clampDay = (year: number, month: number, day: number): number => {
  const maxDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, maxDay);
};

const getCycleEndDate = (reference: Date, closingDay: number): Date => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = reference.getDate();
  if (day <= closingDay) {
    return new Date(year, month, clampDay(year, month, closingDay));
  }

  const nextMonth = month + 1;
  return new Date(year, nextMonth, clampDay(year, nextMonth, closingDay));
};

const getDueDate = (cycleEnd: Date, dueDay: number, closingDay: number): Date => {
  const dueMonth = dueDay > closingDay ? cycleEnd.getMonth() : cycleEnd.getMonth() + 1;
  const year = cycleEnd.getFullYear();
  return new Date(year, dueMonth, clampDay(year, dueMonth, dueDay));
};

const buildCycleRange = (cycleEnd: Date): { start: Date; end: Date } => {
  const end = startOfDay(cycleEnd);
  const prevMonth = end.getMonth() - 1;
  const prevYear = end.getFullYear();
  const prevEndDay = clampDay(prevYear, prevMonth, end.getDate());
  const prevEnd = new Date(prevYear, prevMonth, prevEndDay);
  const start = startOfDay(new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() + 1));
  return { start, end };
};

const calculateStartingBalance = (transactions: Transaction[], startDate: Date): number =>
  transactions
    .filter((transaction) => new Date(transaction.date) < startDate)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const buildBillingCycles = (
  totalCycles: number,
  transactions: Transaction[],
  card: CreditCard
): BillingCycle[] => {
  const today = startOfDay(new Date());
  const dailyTotals = groupTransactionsByDay(transactions);
  const currentCycleEnd = getCycleEndDate(today, card.closingDay);
  const cyclesBefore = Math.floor(totalCycles / 2);
  const cycles: BillingCycle[] = [];

  let runningCycleEnd = new Date(currentCycleEnd);
  runningCycleEnd.setMonth(currentCycleEnd.getMonth() - cyclesBefore);

  let runningBalance = calculateStartingBalance(transactions, buildCycleRange(runningCycleEnd).start);

  for (let offset = 0; offset < totalCycles; offset += 1) {
    const cycleEnd = new Date(runningCycleEnd.getFullYear(), runningCycleEnd.getMonth() + offset, runningCycleEnd.getDate());
    const { start: cycleStart, end } = buildCycleRange(cycleEnd);
    const label = cycleEnd.toLocaleDateString('pt-BR', { month: 'short' });
    const year = cycleEnd.getFullYear();
    const monthIndex = cycleEnd.getMonth();
    const dueDate = getDueDate(cycleEnd, card.dueDay, card.closingDay);
    const daysInCycle = Math.round((end.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const firstWeekday = cycleStart.getDay();
    const leadingBlanks = (firstWeekday + 6) % 7;
    const startBalance = runningBalance;
    let incomeTotal = 0;
    let expensesTotal = 0;

    const cells: CalendarCell[] = [];
    for (let i = 0; i < leadingBlanks; i += 1) {
      cells.push({ isPlaceholder: true });
    }

    for (let dayIndex = 0; dayIndex < daysInCycle; dayIndex += 1) {
      const date = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + dayIndex);
      const isoDate = formatIsoDate(date);
      const dayTransactions = dailyTotals.get(isoDate) ?? [];
      const incomeCount = dayTransactions.filter((t) => t.amount > 0).length;
      const expenseCount = dayTransactions.filter((t) => t.amount < 0).length;
      const income = dayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      incomeTotal += income;
      expensesTotal += expenses;
      runningBalance += income + expenses;

      cells.push({
        isPlaceholder: false,
        day: {
          date,
          isoDate,
          income,
          expenses,
          balance: runningBalance,
          transactions: dayTransactions,
          incomeCount,
          expenseCount,
          isToday: date.getTime() === today.getTime()
        }
      });
    }

    const totalCells = cells.length;
    const trailingBlanks = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < trailingBlanks; i += 1) {
      cells.push({ isPlaceholder: true });
    }

    cycles.push({
      label: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
      year,
      monthIndex,
      cycleStart,
      cycleEnd: end,
      dueDate,
      cardId: card.id,
      startBalance,
      endBalance: runningBalance,
      incomeTotal,
      expensesTotal,
      cells
    });
  }

  return cycles;
};
