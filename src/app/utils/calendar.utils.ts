import { CalendarCell, CalendarMonth } from '../models/calendar.model';
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

export const buildCalendarMonths = (totalMonths: number, transactions: Transaction[]): CalendarMonth[] => {
  const today = startOfDay(new Date());
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const dailyTotals = groupTransactionsByDay(transactions);

  const months: CalendarMonth[] = [];
  let runningBalance = 0;

  for (let offset = 0; offset < totalMonths; offset += 1) {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + offset, 1);
    const label = monthDate.toLocaleDateString('pt-BR', { month: 'long' });
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = monthDate.getDay();
    const leadingBlanks = (firstWeekday + 6) % 7;
    const startBalance = runningBalance;
    let incomeTotal = 0;
    let expensesTotal = 0;

    const cells: CalendarCell[] = [];
    for (let i = 0; i < leadingBlanks; i += 1) {
      cells.push({ isPlaceholder: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
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

    months.push({
      label: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
      year,
      monthIndex,
      startBalance,
      endBalance: runningBalance,
      incomeTotal,
      expensesTotal,
      budgetConfigured: incomeTotal !== 0 || expensesTotal !== 0,
      cells
    });
  }

  return months;
};
