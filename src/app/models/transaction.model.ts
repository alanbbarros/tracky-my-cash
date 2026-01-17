export type TransactionType = 'entrada' | 'saida';
export type PaymentMethod = 'credito' | 'debito' | 'pix';
export type RecurrenceType = 'nenhuma' | 'mensal' | 'quinzenal' | 'semanal' | 'trimestral';

export interface InstallmentInfo {
  current: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
  recurrence: RecurrenceType;
  recurrenceGroupId?: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  cardId?: string;
  installment?: InstallmentInfo;
  invoiceCycleId?: string;
  isInvoicePayment?: boolean;
}

export type NewTransaction = Omit<Transaction, 'id'>;
