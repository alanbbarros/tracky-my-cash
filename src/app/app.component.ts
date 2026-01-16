import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';

interface Transaction {
  date: string;
  title: string;
  amount: number;
  category: string;
}

interface CalendarDay {
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

interface CalendarCell {
  day?: CalendarDay;
  isPlaceholder: boolean;
}

interface CalendarMonth {
  label: string;
  year: number;
  monthIndex: number;
  cells: CalendarCell[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  readonly transactions: Transaction[] = [
    {
      date: this.formatIsoDate(this.addDays(new Date(), 0)),
      title: 'Salário mensal',
      amount: 6200,
      category: 'Receitas'
    },
    {
      date: this.formatIsoDate(this.addDays(new Date(), 1)),
      title: 'Assinatura streaming',
      amount: -49.9,
      category: 'Assinaturas'
    },
    {
      date: this.formatIsoDate(this.addDays(new Date(), 4)),
      title: 'Mercado da semana',
      amount: -280.4,
      category: 'Mercado'
    },
    {
      date: this.formatIsoDate(this.addDays(new Date(), 7)),
      title: 'Freelance design',
      amount: 1200,
      category: 'Receitas'
    },
    {
      date: this.formatIsoDate(this.addDays(new Date(), 11)),
      title: 'Academia',
      amount: -119.9,
      category: 'Saúde'
    },
    {
      date: this.formatIsoDate(this.addDays(new Date(), 14)),
      title: 'Restaurante',
      amount: -96.5,
      category: 'Lazer'
    }
  ];

  readonly months = this.buildCalendarMonths(20);
  selectedDay = this.months[0]?.cells.find((cell) => cell.day)?.day ?? null;
  isModalOpen = false;
  newEntry = {
    amount: '',
    type: 'entrada',
    date: this.formatIsoDate(new Date()),
    recurrence: 'mensal'
  };

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return 'Selecione um dia no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  onHoverDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private buildCalendarMonths(totalMonths: number): CalendarMonth[] {
    const today = this.startOfDay(new Date());
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dailyTotals = this.groupTransactionsByDay();

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

      const cells: CalendarCell[] = [];
      for (let i = 0; i < leadingBlanks; i += 1) {
        cells.push({ isPlaceholder: true });
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, monthIndex, day);
        const isoDate = this.formatIsoDate(date);
        const dayTransactions = dailyTotals.get(isoDate) ?? [];
        const incomeCount = dayTransactions.filter((t) => t.amount > 0).length;
        const expenseCount = dayTransactions.filter((t) => t.amount < 0).length;
        const income = dayTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = dayTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
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
        cells
      });
    }

    return months;
  }

  private groupTransactionsByDay(): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();

    for (const transaction of this.transactions) {
      const list = grouped.get(transaction.date) ?? [];
      list.push(transaction);
      grouped.set(transaction.date, list);
    }

    return grouped;
  }

  private addDays(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return this.startOfDay(copy);
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private formatIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
