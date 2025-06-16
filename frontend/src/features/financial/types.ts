export interface FinancialLog {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  tags?: string;
  createdAt: Date;
  lastModified: Date;
}

export interface FinancialBalance {
  id: string;
  date: string;
  amount: number;
  account_name: string;
  account_type: string;
  account_owner: string;
  createdAt: Date;
  lastModified: Date;
}

export interface PaycheckInfo {
  id: string;
  date: string;
  amount: number;
  category: string;
  deduction_type: string;
  createdAt: Date;
  lastModified: Date;
}

export interface FinancialFile {
  id: string;
  date: string;
  files: string[];
  createdAt: Date;
  lastModified: Date;
}