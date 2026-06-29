import type { Category, Classification, CurrencyTotals, ItemCurrency } from '@/types'

export function formatAmount(value: number, currency: ItemCurrency | string): string {
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function sumCategories(categories: Category[], currency: ItemCurrency): number {
  return categories
    .filter((c) => (c.currency ?? 'Br') === currency)
    .reduce((s, c) => s + c.amount, 0)
}

export function totalsForCategories(categories: Category[]): CurrencyTotals {
  return {
    Br: sumCategories(categories, 'Br'),
    USD: sumCategories(categories, 'USD'),
  }
}

export function totalsForClassifications(classifications: Classification[]): CurrencyTotals {
  const all = classifications.flatMap((c) => c.categories)
  return totalsForCategories(all)
}

export function hasAmount(totals: CurrencyTotals, currency: ItemCurrency): boolean {
  return totals[currency] > 0
}
