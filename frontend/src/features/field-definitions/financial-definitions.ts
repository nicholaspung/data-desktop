import { FieldDefinitionsDataset } from "@/types/types";

export const FINANCIAL_LOGS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "financial_logs",
  name: "Financial Logs",
  description: "Financial transaction logs for expense and income tracking",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the financial transaction",
      isSearchable: true,
    },
    {
      key: "amount",
      type: "number",
      displayName: "Amount",
      description:
        "Transaction amount (use negative for expenses, positive for income)",
      unit: "$",
    },
    {
      key: "description",
      type: "autocomplete",
      displayName: "Description",
      description: "Description of the transaction",
      isSearchable: true,
    },
    {
      key: "category",
      type: "autocomplete",
      displayName: "Category",
      description:
        "Category of the transaction (e.g., Food, Entertainment, Salary)",
      isSearchable: true,
    },
    {
      key: "tags",
      type: "tags",
      displayName: "Tags",
      description: "Tags for categorizing transactions",
      isSearchable: true,
      isOptional: true,
    },
  ],
};

export const FINANCIAL_BALANCES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "financial_balances",
  name: "Financial Balances",
  description: "Account balances tracking for financial monitoring",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the balance snapshot",
      isSearchable: true,
    },
    {
      key: "amount",
      type: "number",
      displayName: "Amount",
      description: "Account balance amount",
      unit: "$",
    },
    {
      key: "account_name",
      type: "autocomplete",
      displayName: "Account Name",
      description: "Name of the account (e.g., Checking, Savings, Credit Card)",
      isSearchable: true,
    },
    {
      key: "account_type",
      type: "autocomplete",
      displayName: "Account Type",
      description:
        "Type of account (e.g., Checking, Savings, Investment, Credit)",
      isSearchable: true,
    },
    {
      key: "account_owner",
      type: "autocomplete",
      displayName: "Account Owner",
      description: "Owner of the account",
      isSearchable: true,
    },
  ],
};

export const PAYCHECK_INFO_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "paycheck_info",
  name: "Paycheck Information",
  description: "Paycheck details including deductions and benefits",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the paycheck",
      isSearchable: true,
    },
    {
      key: "amount",
      type: "number",
      displayName: "Amount",
      description: "Paycheck amount",
      unit: "$",
    },
    {
      key: "deduction_type",
      type: "autocomplete",
      displayName: "Deduction Type",
      description: "Type of deduction (e.g., Tax, Benefit, Investment, Income)",
      isSearchable: true,
    },
    {
      key: "category",
      type: "autocomplete",
      displayName: "Category",
      description:
        "Category of the paycheck item (e.g., Gross Pay, Federal Tax, 401k)",
      isSearchable: true,
    },
  ],
};

export const FINANCIAL_FILES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "financial_files",
  name: "Financial Files",
  description: "Financial document storage and management",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date associated with the financial files",
    },
    {
      key: "files",
      type: "file-multiple",
      displayName: "Files",
      description: "Financial documents (CSV, PDF, images, etc.)",
    },
  ],
};
