export type ItemCurrency = 'Br' | 'USD'

export interface Category {
  id: string
  name: string
  color: string
  amount: number
  currency: ItemCurrency
}

export interface Classification {
  id: string
  name: string
  color: string
  categories: Category[]
}

export interface CompanyData {
  name: string
  currency: ItemCurrency
  classifications: Classification[]
}

export interface SavedPlan {
  id: string
  label: string
  data: CompanyData
  createdAt: string
  updatedAt: string
}

export interface PlansState {
  activePlanId: string
  plans: SavedPlan[]
}

export interface CurrencyTotals {
  Br: number
  USD: number
}
