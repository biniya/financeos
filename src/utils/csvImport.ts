import type { ImportOptions, ImportResult, ReportingStatus, Transaction, TransactionType } from '@/types/transactions'
import type { ItemCurrency } from '@/types'
import { uid, now } from '@/utils/planHelpers'

const HEADERS = ['date', 'account', 'category', 'classification', 'type', 'currency', 'amount', 'reporting', 'description', 'reference'] as const

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function mapCurrency(raw: string): ItemCurrency {
  const c = raw.trim().toUpperCase()
  if (c === 'USD') return 'USD'
  return 'Br'
}

function mapReporting(raw: string): ReportingStatus {
  return raw.trim().toLowerCase() === 'reported' ? 'reported' : 'unreported'
}

function mapType(raw: string): TransactionType | null {
  const t = raw.trim().toLowerCase()
  if (t === 'expense' || t === 'income') return t
  return null
}

export function transactionFingerprint(t: Pick<Transaction, 'date' | 'amount' | 'description' | 'type'>): string {
  return `${t.date}|${t.type}|${t.amount}|${t.description}`
}

export function parseTransactionsCsv(text: string, options: ImportOptions = {}): ImportResult {
  const stripCategories = options.stripCategories !== false
  const errors: string[] = []
  const transactions: Transaction[] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())

  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: ['CSV file is empty or has no data rows'], transactions: [] }
  }

  const headerFields = parseCsvLine(lines[0]!).map((h) => h.toLowerCase())
  const colIndex: Partial<Record<(typeof HEADERS)[number], number>> = {}
  for (const h of HEADERS) {
    const idx = headerFields.indexOf(h)
    if (idx !== -1) colIndex[h] = idx
  }

  if (colIndex.date === undefined || colIndex.amount === undefined || colIndex.type === undefined) {
    return {
      imported: 0,
      skipped: 0,
      errors: ['Missing required columns: Date, Type, Amount'],
      transactions: [],
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!)
    const get = (key: (typeof HEADERS)[number]) => {
      const idx = colIndex[key]
      return idx !== undefined ? (fields[idx] ?? '').trim() : ''
    }

    const type = mapType(get('type'))
    if (!type) {
      errors.push(`Row ${i + 1}: invalid type`)
      continue
    }

    const amount = parseFloat(get('amount').replace(/,/g, ''))
    if (!Number.isFinite(amount)) {
      errors.push(`Row ${i + 1}: invalid amount`)
      continue
    }

    const date = get('date')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i + 1}: invalid date "${date}"`)
      continue
    }

    const csvCategory = get('category')
    const csvClassification = get('classification')
    let importHint: string | undefined

    if (stripCategories && (csvCategory || csvClassification)) {
      const parts = [csvCategory, csvClassification].filter(Boolean)
      importHint = parts.join(' · ')
    }

    transactions.push({
      id: uid(),
      date,
      account: get('account'),
      category: stripCategories ? '' : csvCategory || 'Uncategorized',
      classification: stripCategories ? '' : csvClassification || 'Unclassified',
      type,
      currency: mapCurrency(get('currency')),
      amount,
      reporting: mapReporting(get('reporting')),
      description: get('description'),
      reference: get('reference'),
      importedAt: now(),
      importHint,
    })
  }

  return { imported: transactions.length, skipped: 0, errors, transactions }
}

export function dedupeImport(
  incoming: Transaction[],
  existing: Transaction[],
): { toAdd: Transaction[]; skipped: number } {
  const existingKeys = new Set(existing.map(transactionFingerprint))
  const toAdd: Transaction[] = []
  let skipped = 0

  for (const t of incoming) {
    const key = transactionFingerprint(t)
    if (existingKeys.has(key)) {
      skipped++
    } else {
      toAdd.push(t)
      existingKeys.add(key)
    }
  }

  return { toAdd, skipped }
}
