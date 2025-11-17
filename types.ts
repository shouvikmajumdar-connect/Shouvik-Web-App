export enum TransactionType {
  EXPENDITURE = 'Expenditure',
  EARNING = 'Earning',
}

export interface Transaction {
  id: string;
  date: string;
  item: string;
  type: TransactionType;
  amount: number;
  paymentMode: string;
  description: string;
  comments: string;
}

export interface Notebook {
  id: string;
  name:string;
  currency: string;
  transactions: Transaction[];
  createdAt: number;
}