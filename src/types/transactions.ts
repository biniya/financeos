import type { ItemCurrency } from '@/types'

export type TransactionType = 'expense' | 'income'
export type ReportingStatus = 'unreported' | 'reported'

export interface Transaction {
  id: string
  date: string
  account: string
  category: string
  classification: string
  type: TransactionType
  currency: ItemCurrency
  amount: number
  reporting: ReportingStatus
  description: string
  reference: string
  importedAt: string
  /** Original CSV category/classification hint — shown while you categorize */
  importHint?: string
}

export interface ImportOptions {
  /** When true, category & classification are cleared so you assign them manually */
  stripCategories?: boolean
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
  transactions: Transaction[]
}

export interface CategoryTotal {
  name: string
  amount: number
  count: number
}

export interface MonthTotal {
  month: string
  income: number
  expense: number
}

export type TransactionPatch = Partial<
  Pick<
    Transaction,
    | 'date'
    | 'account'
    | 'category'
    | 'classification'
    | 'type'
    | 'currency'
    | 'amount'
    | 'reporting'
    | 'description'
    | 'reference'
    | 'importHint'
  >
>

/** Common classifications — matches Plan tree vocabulary */
export const DEFAULT_CLASSIFICATIONS = [
  'Fixed recurring',
  'Variable recurring',
  'Startup / CAPEX',
  'As-needed',
  'Project / Campaign',
  'Unclassified',
] as const

export function isUncategorized(tx: Pick<Transaction, 'category' | 'classification'>): boolean {
  const cat = tx.category.trim()
  const cls = tx.classification.trim()
  return !cat || cat === 'Uncategorized' || !cls || cls === 'Unclassified'
}

export function displayCategory(tx: Pick<Transaction, 'category'>): string {
  const c = tx.category.trim()
  return c && c !== 'Uncategorized' ? c : '—'
}

export function displayClassification(tx: Pick<Transaction, 'classification'>): string {
  const c = tx.classification.trim()
  return c && c !== 'Unclassified' ? c : '—'
}
