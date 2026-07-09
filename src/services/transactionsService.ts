import type { Transaction } from '@/types/transactions'
import { supabase } from '@/lib/supabase'

interface TransactionRow {
  id: string
  user_id: string
  plan_id: string | null
  date: string
  account: string
  category: string
  classification: string
  type: string
  currency: string
  amount: number
  reporting: string
  description: string
  reference: string
  is_one_time: boolean
  imported_at: string
  updated_at: string
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    account: row.account,
    category: row.category,
    classification: row.classification,
    type: row.type as Transaction['type'],
    currency: row.currency as Transaction['currency'],
    amount: Number(row.amount),
    reporting: row.reporting as Transaction['reporting'],
    description: row.description,
    reference: row.reference,
    isOneTime: row.is_one_time ?? false,
    importedAt: row.imported_at,
  }
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase!
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data as TransactionRow[]).map(toTransaction)
}

export async function upsertTransaction(userId: string, tx: Transaction): Promise<void> {
  const { error } = await supabase!.from('transactions').upsert({
    id: tx.id,
    user_id: userId,
    plan_id: null,
    date: tx.date,
    account: tx.account,
    category: tx.category,
    classification: tx.classification,
    type: tx.type,
    currency: tx.currency,
    amount: tx.amount,
    reporting: tx.reporting,
    description: tx.description,
    reference: tx.reference,
    is_one_time: tx.isOneTime ?? false,
    imported_at: tx.importedAt,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function upsertTransactions(userId: string, txs: Transaction[]): Promise<void> {
  if (!txs.length) return
  const rows = txs.map((tx) => ({
    id: tx.id,
    user_id: userId,
    plan_id: null,
    date: tx.date,
    account: tx.account,
    category: tx.category,
    classification: tx.classification,
    type: tx.type,
    currency: tx.currency,
    amount: tx.amount,
    reporting: tx.reporting,
    description: tx.description,
    reference: tx.reference,
    is_one_time: tx.isOneTime ?? false,
    imported_at: tx.importedAt,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase!.from('transactions').upsert(rows)
  if (error) throw error
}

export async function deleteTransactionRemote(id: string): Promise<void> {
  const { error } = await supabase!.from('transactions').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllTransactionsRemote(userId: string): Promise<void> {
  const { error } = await supabase!.from('transactions').delete().eq('user_id', userId)
  if (error) throw error
}
