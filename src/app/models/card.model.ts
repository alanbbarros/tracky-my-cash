export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export type NewCard = Omit<Card, 'id'>;
