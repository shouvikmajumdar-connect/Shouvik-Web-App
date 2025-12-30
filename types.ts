
export enum TransactionType {
  EXPENDITURE = 'Expenditure',
  EARNING = 'Earning',
}

export type TransactionCategory = 
  | 'Food & Drink' 
  | 'Shopping' 
  | 'Transport' 
  | 'Bills & Utilities' 
  | 'Entertainment' 
  | 'Health' 
  | 'Salary' 
  | 'Investment' 
  | 'Gift' 
  | 'Others';

export interface Transaction {
  id: string;
  date: string;
  item: string;
  type: TransactionType;
  category: TransactionCategory;
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
