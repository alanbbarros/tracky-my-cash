export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
  recurrence: 'nenhuma' | 'semanal' | 'mensal' | 'anual';
  type: 'entrada' | 'saida';
  paymentMethod: 'credito' | 'debito' | 'pix';
  cardId?: string;
  installment?: {
    current: number;
    total: number;
  };
  recurrenceGroupId?: string;
  invoiceId?: string;
}

export type NewTransaction = Omit<Transaction, 'id'>;

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  cardId?: string;
  text?: string;
}
