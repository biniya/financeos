import type { Category, CompanyData, SavedPlan } from '@/types'

export const PLANS_LOCAL_KEY = 'financeos-plans'
export const LEGACY_LOCAL_KEY = 'financeos-classification'

export function uid() {
  return crypto.randomUUID()
}

export function now() {
  return new Date().toISOString()
}

export function normalizeCategory(cat: Category): Category {
  return { ...cat, currency: cat.currency ?? 'Br' }
}

export function normalizeData(data: CompanyData): CompanyData {
  return {
    ...data,
    currency: data.currency ?? 'Br',
    classifications: data.classifications.map((c) => ({
      ...c,
      categories: c.categories.map(normalizeCategory),
    })),
  }
}

export function emptyData(): CompanyData {
  return { name: '', currency: 'Br', classifications: [] }
}

export function planLabel(data: CompanyData, fallback = 'Untitled plan') {
  return data.name.trim() || fallback
}

export function createEmptyPlan(): SavedPlan {
  return {
    id: uid(),
    label: 'Untitled plan',
    data: emptyData(),
    createdAt: now(),
    updatedAt: now(),
  }
}

export function loadLocalPlansState(): { activePlanId: string; plans: SavedPlan[] } | null {
  const raw = localStorage.getItem(PLANS_LOCAL_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { activePlanId: string; plans: SavedPlan[] }
    return {
      activePlanId: parsed.activePlanId,
      plans: parsed.plans.map((p) => ({ ...p, data: normalizeData(p.data) })),
    }
  } catch {
    return null
  }
}

export function saveLocalPlansState(activePlanId: string, plans: SavedPlan[]) {
  localStorage.setItem(PLANS_LOCAL_KEY, JSON.stringify({ activePlanId, plans }))
}

export function migrateLegacyLocalPlan(): SavedPlan | null {
  const raw = localStorage.getItem(LEGACY_LOCAL_KEY)
  if (!raw) return null
  try {
    const data = normalizeData(JSON.parse(raw) as CompanyData)
    localStorage.removeItem(LEGACY_LOCAL_KEY)
    return {
      id: uid(),
      label: planLabel(data),
      data,
      createdAt: now(),
      updatedAt: now(),
    }
  } catch {
    return null
  }
}

export function initialLocalState(): { activePlanId: string; plans: SavedPlan[] } {
  const legacy = migrateLegacyLocalPlan()
  if (legacy) {
    return { activePlanId: legacy.id, plans: [legacy] }
  }
  const local = loadLocalPlansState()
  if (local?.plans.length) {
    return local
  }
  const plan = createEmptyPlan()
  return { activePlanId: plan.id, plans: [plan] }
}
