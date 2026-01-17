import { BillingCycle, CalendarCell } from '../models/calendar.model';
import { Transaction } from '../models/transaction.model';

export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const CYCLE_START_DAY = 9;
const CYCLE_END_DAY = 8;
const CYCLE_DUE_DAY = 15;

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

const getWeekdayIndex = (date: Date): number => (date.getDay() + 6) % 7;

const startOfWeek = (date: Date): Date => addDays(startOfDay(date), -getWeekdayIndex(date));

const endOfWeek = (date: Date): Date => addDays(startOfDay(date), 6 - getWeekdayIndex(date));

const formatMonthShort = (date: Date): string => {
  const label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatMonthShortLower = (date: Date): string => formatMonthShort(date).toLowerCase();

const formatDayMonth = (date: Date): string =>
  `${date.toLocaleDateString('pt-BR', { day: '2-digit' })} ${formatMonthShortLower(date)}`;

const formatDueDate = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const resolveCycleForDate = (date: Date): { startDate: Date; endDate: Date; dueDate: Date } => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (date.getDate() >= CYCLE_START_DAY) {
    return {
      startDate: new Date(year, month, CYCLE_START_DAY),
      endDate: new Date(year, month + 1, CYCLE_END_DAY),
      dueDate: new Date(year, month + 1, CYCLE_DUE_DAY)
    };
  }

  return {
    startDate: new Date(year, month - 1, CYCLE_START_DAY),
    endDate: new Date(year, month, CYCLE_END_DAY),
    dueDate: new Date(year, month, CYCLE_DUE_DAY)
  };
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

export const buildBillingCycles = (totalCycles: number, transactions: Transaction[]): BillingCycle[] => {
  const today = startOfDay(new Date());
  const dailyTotals = groupTransactionsByDay(transactions);
  const { startDate: baseStart } = resolveCycleForDate(today);

  const cycles: BillingCycle[] = [];
  let runningBalance = 0;

  for (let offset = 0; offset < totalCycles; offset += 1) {
    const cycleStart = addMonths(baseStart, offset);
    const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, CYCLE_END_DAY);
    const dueDate = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, CYCLE_DUE_DAY);
    const titleMonth = formatMonthShort(dueDate);
    const cycleRangeLabel = `${formatDayMonth(cycleStart)} → ${formatDayMonth(cycleEnd)}`;
    const dueDateLabel = formatDueDate(dueDate);
    const startBalance = runningBalance;
    let incomeTotal = 0;
    let expensesTotal = 0;

    const cells: CalendarCell[] = [];

    const gridStart = startOfWeek(cycleStart);
    const gridEnd = endOfWeek(cycleEnd);
    for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
      const isoDate = formatIsoDate(date);
      const isInCycle = date >= cycleStart && date <= cycleEnd;
      const dayTransactions = isInCycle ? dailyTotals.get(isoDate) ?? [] : [];
      const incomeCount = dayTransactions.filter((t) => t.amount > 0).length;
      const expenseCount = dayTransactions.filter((t) => t.amount < 0).length;
      const income = dayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      if (isInCycle) {
        incomeTotal += income;
        expensesTotal += expenses;
        runningBalance += income + expenses;
      }

      cells.push({
        isPlaceholder: false,
        isInCycle,
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

    cycles.push({
      id: formatIsoDate(cycleStart),
      label: `Fatura ${titleMonth}/${dueDate.getFullYear()}`,
      cycleStart,
      cycleEnd,
      dueDate,
      cycleRangeLabel,
      dueDateLabel,
      startBalance,
      endBalance: runningBalance,
      incomeTotal,
      expensesTotal,
      budgetConfigured: incomeTotal !== 0 || expensesTotal !== 0,
      cells
    });
  }

  return cycles;
};
