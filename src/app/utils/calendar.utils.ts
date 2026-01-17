import { BillingCycle, CalendarCell } from '../models/calendar.model';
import { Card } from '../models/card.model';
import { Transaction } from '../models/transaction.model';

export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, amount: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const clampDay = (year: number, monthIndex: number, day: number): Date => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, daysInMonth));
};

const addMonthsClamp = (date: Date, amount: number, day: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return clampDay(target.getFullYear(), target.getMonth(), day);
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

const buildCycleDates = (referenceDate: Date, card: Card): { start: Date; end: Date } => {
  const date = startOfDay(referenceDate);
  const closingDay = card.closingDay;
  const closingThisMonth = clampDay(date.getFullYear(), date.getMonth(), closingDay);
  const end = date <= closingThisMonth ? closingThisMonth : addMonthsClamp(closingThisMonth, 1, closingDay);
  const previousClosing = addMonthsClamp(end, -1, closingDay);
  const start = addDays(previousClosing, 1);
  return { start, end };
};

const resolveDueDate = (cycleEnd: Date, dueDay: number): Date => {
  const endDay = cycleEnd.getDate();
  const dueMonthOffset = dueDay <= endDay ? 1 : 0;
  return clampDay(cycleEnd.getFullYear(), cycleEnd.getMonth() + dueMonthOffset, dueDay);
};

const resolveCycleLabel = (dueDate: Date): string => {
  const monthLabel = dueDate.toLocaleDateString('pt-BR', { month: 'short' });
  const label = monthLabel.replace('.', '');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}/${dueDate.getFullYear()}`;
};

const resolvePeriodLabel = (start: Date, end: Date): string => {
  const startLabel = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const endLabel = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  return `${startLabel} → ${endLabel}`;
};

export const buildBillingCycles = (
  totalCycles: number,
  card: Card,
  transactions: Transaction[]
): BillingCycle[] => {
  const today = startOfDay(new Date());
  const dailyTotals = groupTransactionsByDay(transactions);
  const { end: baseEnd } = buildCycleDates(today, card);
  const cycles: BillingCycle[] = [];
  const pastCycles = Math.floor(totalCycles / 2);

  let runningBalance = 0;

  for (let offset = -pastCycles; offset < totalCycles - pastCycles; offset += 1) {
    const cycleEnd = addMonthsClamp(baseEnd, offset, card.closingDay);
    const cycleStart = addDays(addMonthsClamp(cycleEnd, -1, card.closingDay), 1);
    const dueDate = resolveDueDate(cycleEnd, card.dueDay);
    const label = resolveCycleLabel(dueDate);
    const periodLabel = resolvePeriodLabel(cycleStart, cycleEnd);
    const cycleId = `${card.id}-${formatIsoDate(cycleEnd)}`;

    const cells: CalendarCell[] = [];
    const startWeekday = cycleStart.getDay();
    const leadingBlanks = (startWeekday + 6) % 7;
    for (let i = 0; i < leadingBlanks; i += 1) {
      cells.push({ isPlaceholder: true });
    }

    let incomeTotal = 0;
    let expensesTotal = 0;
    let creditTotal = 0;
    let creditCount = 0;
    const startBalance = runningBalance;
    const days = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / 86400000) + 1;

    for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
      const date = addDays(cycleStart, dayOffset);
      const isoDate = formatIsoDate(date);
      const dayTransactions = dailyTotals.get(isoDate) ?? [];
      const income = dayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      const incomeCount = dayTransactions.filter((t) => t.amount > 0).length;
      const expenseCount = dayTransactions.filter((t) => t.amount < 0).length;

      const creditTransactions = dayTransactions.filter(
        (t) => t.paymentMethod === 'credito' && t.cardId === card.id && t.amount < 0 && !t.isInvoicePayment
      );
      const dailyCredit = creditTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      creditTotal += dailyCredit;
      creditCount += creditTransactions.length;

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

    const paymentExists = transactions.some(
      (t) => t.isInvoicePayment && t.invoiceCycleId === cycleId
    );
    const status = paymentExists ? 'paga' : today > cycleEnd ? 'fechada' : 'aberta';

    cycles.push({
      id: cycleId,
      label: `Fatura • ${label}`,
      periodLabel,
      dueDate,
      startDate: cycleStart,
      endDate: cycleEnd,
      startBalance,
      endBalance: runningBalance,
      incomeTotal,
      expensesTotal,
      creditTotal,
      creditCount,
      status,
      cells
    });
  }

  return cycles;
};

export const getCurrentCycle = (cycles: BillingCycle[]): BillingCycle | null => {
  if (!cycles.length) {
    return null;
  }

  const todayIso = formatIsoDate(new Date());
  return cycles.find((cycle) => cycle.cells.some((cell) => cell.day?.isoDate === todayIso)) ?? cycles[0];
};
