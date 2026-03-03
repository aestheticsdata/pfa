export interface Spending {
  ID: string;
  amount: number;
  category: string | null;
  categoryColor: string | null;
  categoryID: string | null;
  currency: string | null;
  date: string;
  invoicefile: null | string;
  itemType: string;
  label: string;
  userID: string;
}

export interface MonthRange {
  start: Date;
  end: Date;
}
