export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
  recurrence: string;
  type: 'entrada' | 'saida';
}

export type NewTransaction = Omit<Transaction, 'id'>;
