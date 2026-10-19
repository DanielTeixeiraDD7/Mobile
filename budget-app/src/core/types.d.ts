// Types du cœur de données (repris tel quel de la v1, voir README).
export type Kind = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: Kind;
  amount: number; // centimes
  categoryId: string;
  date: string; // AAAA-MM-JJ
  note: string;
  createdAt: number;
  createdBy?: string;
  paidBy?: string;
  shared?: boolean;
}

export interface Category {
  id: string;
  key?: string | null;
  name?: string | null;
  kind: Kind;
  color: string;
  budget: number | null; // centimes
  order?: number;
  locked?: boolean;
}

export interface Settlement { id: string; month: string; from: string; to: string; amount: number; createdAt: number }

export interface Settings { lang: 'fr' | 'pt'; currency: string; monthlyBudget: number | null; [k: string]: unknown }

export interface Member { user_id: string; display_name: string; role: string }
