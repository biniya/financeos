import type { CategoryTotal, MonthTotal, Transaction } from '@/types/transactions'
import { isUncategorized } from '@/types/transactions'
import { format, parseISO } from 'date-fns'

export function sumByType(transactions: Transaction[], type: 'expense' | 'income'): number {
  return transactions
    .filter((t) => t.type === type && t.currency === 'Br' && !isUncategorized(t))
    .reduce((s, t) => s + t.amount, 0)
}

function labelCategory(name: string): string {
  const c = name.trim()
  return c && c !== 'Uncategorized' ? c : 'Uncategorized'
}

function labelClassification(name: string): string {
  const c = name.trim()
  return c && c !== 'Unclassified' ? c : 'Unclassified'
}

export function groupByCategory(transactions: Transaction[], type?: 'expense' | 'income'): CategoryTotal[] {
  const map = new Map<string, { amount: number; count: number }>()

  for (const t of transactions) {
    if (t.currency !== 'Br' || isUncategorized(t)) continue
    if (type && t.type !== type) continue
    const key = labelCategory(t.category)
    const cur = map.get(key) ?? { amount: 0, count: 0 }
    cur.amount += t.amount
    cur.count++
    map.set(key, cur)
  }

  return [...map.entries()]
    .map(([name, { amount, count }]) => ({ name, amount, count }))
    .sort((a, b) => b.amount - a.amount)
}

export function groupByClassification(transactions: Transaction[], type: 'expense' | 'income' = 'expense'): CategoryTotal[] {
  const map = new Map<string, { amount: number; count: number }>()

  for (const t of transactions) {
    if (t.currency !== 'Br' || t.type !== type || isUncategorized(t)) continue
    const key = labelClassification(t.classification)
    const cur = map.get(key) ?? { amount: 0, count: 0 }
    cur.amount += t.amount
    cur.count++
    map.set(key, cur)
  }

  return [...map.entries()]
    .map(([name, { amount, count }]) => ({ name, amount, count }))
    .sort((a, b) => b.amount - a.amount)
}

export function groupByMonth(transactions: Transaction[]): MonthTotal[] {
  const map = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    if (t.currency !== 'Br' || isUncategorized(t)) continue
    const month = format(parseISO(t.date), 'yyyy-MM')
    const cur = map.get(month) ?? { income: 0, expense: 0 }
    if (t.type === 'income') cur.income += t.amount
    else cur.expense += t.amount
    map.set(month, cur)
  }

  return [...map.entries()]
    .map(([month, totals]) => ({ month, ...totals }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function dateRange(transactions: Transaction[]): { min: string; max: string } | null {
  if (!transactions.length) return null
  const dates = transactions.map((t) => t.date).sort()
  return { min: dates[0]!, max: dates[dates.length - 1]! }
}

export function uniqueValues(transactions: Transaction[], field: 'category' | 'classification'): string[] {
  const set = new Set<string>()
  for (const t of transactions) {
    const raw = t[field].trim()
    if (!raw || raw === 'Uncategorized' || raw === 'Unclassified') continue
    set.add(raw)
  }
  return [...set].sort()
}

export function uncategorizedTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(isUncategorized)
}
