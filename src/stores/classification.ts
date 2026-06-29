import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Category, Classification, ItemCurrency, PlansState, SavedPlan } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  deletePlanRemote,
  fetchPlans,
  fetchSettings,
  upsertPlan,
  upsertSettings,
} from '@/services/plansService'
import { useAuthStore } from '@/stores/auth'
import { totalsForClassifications } from '@/utils/format'
import {
  createEmptyPlan,
  initialLocalState,
  loadLocalPlansState,
  migrateLegacyLocalPlan,
  now,
  planLabel,
  saveLocalPlansState,
  uid,
} from '@/utils/planHelpers'

export const usePlansStore = defineStore('plans', () => {
  const auth = useAuthStore()

  const state = ref<PlansState>({ activePlanId: '', plans: [] })
  const ready = ref(false)
  const syncing = ref(false)
  const syncError = ref<string | null>(null)
  const usdRate = ref(57.5)

  let syncTimer: ReturnType<typeof setTimeout> | null = null

  const isCloud = computed(() => isSupabaseConfigured && auth.isAuthenticated)
  const activePlan = computed(() => state.value.plans.find((p) => p.id === state.value.activePlanId)!)
  const data = computed(() => activePlan.value?.data)
  const totals = computed(() => totalsForClassifications(data.value?.classifications ?? []))
  const totalBr = computed(() => totals.value.Br)
  const totalUsd = computed(() => totals.value.USD)
  const totalPlanned = computed(() => totalBr.value)

  function persistLocal() {
    saveLocalPlansState(state.value.activePlanId, state.value.plans)
    localStorage.setItem('financeos-usd-rate', String(usdRate.value))
  }

  async function loadFromCloud(userId: string) {
    syncing.value = true
    syncError.value = null
    try {
      let plans = await fetchPlans(userId)

      if (!plans.length) {
        const local = loadLocalPlansState()
        const legacy = migrateLegacyLocalPlan()
        const toUpload = local?.plans.length ? local.plans : legacy ? [legacy] : [createEmptyPlan()]

        for (const plan of toUpload) {
          await upsertPlan(userId, plan)
        }
        plans = await fetchPlans(userId)
        localStorage.removeItem('financeos-plans')
      }

      const settings = await fetchSettings(userId)
      if (settings?.usd_rate) usdRate.value = Number(settings.usd_rate)

      const activeId =
        settings?.active_plan_id && plans.some((p) => p.id === settings.active_plan_id)
          ? settings.active_plan_id
          : (plans[0]?.id ?? '')

      state.value = { activePlanId: activeId, plans }

      if (!settings && plans.length) {
        await upsertSettings(userId, { active_plan_id: activeId, usd_rate: usdRate.value })
      }
    } catch (e) {
      syncError.value = e instanceof Error ? e.message : 'Failed to load from cloud'
      state.value = initialLocalState()
    } finally {
      syncing.value = false
    }
  }

  async function init() {
    ready.value = false

    if (!isSupabaseConfigured) {
      state.value = initialLocalState()
      const savedRate = localStorage.getItem('financeos-usd-rate')
      if (savedRate) usdRate.value = parseFloat(savedRate)
      ready.value = true
      return
    }

    if (!auth.user) {
      ready.value = true
      return
    }

    await loadFromCloud(auth.user.id)
    ready.value = true
  }

  async function onUserSignedIn(userId: string) {
    await loadFromCloud(userId)
  }

  function onUserSignedOut() {
    state.value = { activePlanId: '', plans: [] }
    syncError.value = null
  }

  async function syncPlan(plan: SavedPlan) {
    if (!isCloud.value || !auth.user) {
      persistLocal()
      return
    }
    syncing.value = true
    try {
      await upsertPlan(auth.user.id, plan)
      await upsertSettings(auth.user.id, {
        active_plan_id: state.value.activePlanId,
        usd_rate: usdRate.value,
      })
      syncError.value = null
    } catch (e) {
      syncError.value = e instanceof Error ? e.message : 'Sync failed'
    } finally {
      syncing.value = false
    }
  }

  function scheduleSync() {
    if (!activePlan.value) return
    if (!isCloud.value) {
      persistLocal()
      return
    }
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => syncPlan(activePlan.value), 600)
  }

  function touch() {
    if (!activePlan.value) return
    activePlan.value.updatedAt = now()
    activePlan.value.label = planLabel(activePlan.value.data, activePlan.value.label)
    scheduleSync()
  }

  async function switchPlan(id: string) {
    if (!state.value.plans.some((p) => p.id === id)) return
    state.value.activePlanId = id
    if (isCloud.value && auth.user) {
      await upsertSettings(auth.user.id, { active_plan_id: id, usd_rate: usdRate.value })
    } else {
      persistLocal()
    }
  }

  async function createPlan() {
    const plan = createEmptyPlan()
    state.value.plans.unshift(plan)
    state.value.activePlanId = plan.id
    if (isCloud.value && auth.user) {
      await upsertPlan(auth.user.id, plan)
      await upsertSettings(auth.user.id, { active_plan_id: plan.id, usd_rate: usdRate.value })
    } else {
      persistLocal()
    }
    return plan.id
  }

  async function deletePlan(id: string) {
    if (state.value.plans.length <= 1) return false
    state.value.plans = state.value.plans.filter((p) => p.id !== id)
    if (state.value.activePlanId === id) {
      state.value.activePlanId = state.value.plans[0]!.id
    }
    if (isCloud.value && auth.user) {
      await deletePlanRemote(id)
      await upsertSettings(auth.user.id, {
        active_plan_id: state.value.activePlanId,
        usd_rate: usdRate.value,
      })
    } else {
      persistLocal()
    }
    return true
  }

  async function savePlan() {
    touch()
    if (isCloud.value) await syncPlan(activePlan.value)
    return activePlan.value.label
  }

  function setUsdRate(rate: number) {
    usdRate.value = rate
    if (isCloud.value && auth.user) {
      if (syncTimer) clearTimeout(syncTimer)
      syncTimer = setTimeout(async () => {
        try {
          await upsertSettings(auth.user!.id, {
            usd_rate: rate,
            active_plan_id: state.value.activePlanId,
          })
        } catch {
          /* rate sync is best-effort */
        }
      }, 600)
    } else {
      localStorage.setItem('financeos-usd-rate', String(rate))
    }
  }

  function setCompanyName(name: string) {
    if (!data.value) return
    data.value.name = name
    touch()
  }

  function addClassification(name = 'New classification', color = '#8b5cf6') {
    if (!data.value) return
    data.value.classifications.push({ id: uid(), name, color, categories: [] })
    touch()
  }

  function removeClassification(id: string) {
    if (!data.value) return
    data.value.classifications = data.value.classifications.filter((c) => c.id !== id)
    touch()
  }

  function updateClassification(id: string, patch: Partial<Pick<Classification, 'name' | 'color'>>) {
    const item = data.value?.classifications.find((c) => c.id === id)
    if (item) {
      Object.assign(item, patch)
      touch()
    }
  }

  function addCategory(
    classificationId: string,
    name = 'New category',
    color?: string,
    currency: ItemCurrency = 'Br',
  ) {
    const classification = data.value?.classifications.find((c) => c.id === classificationId)
    if (!classification) return
    classification.categories.push({
      id: uid(),
      name,
      color: color ?? classification.color,
      amount: 0,
      currency,
    })
    touch()
  }

  function removeCategory(classificationId: string, categoryId: string) {
    const classification = data.value?.classifications.find((c) => c.id === classificationId)
    if (!classification) return
    classification.categories = classification.categories.filter((cat) => cat.id !== categoryId)
    touch()
  }

  function updateCategory(
    classificationId: string,
    categoryId: string,
    patch: Partial<Pick<Category, 'name' | 'color' | 'amount' | 'currency'>>,
  ) {
    const classification = data.value?.classifications.find((c) => c.id === classificationId)
    const category = classification?.categories.find((cat) => cat.id === categoryId)
    if (category) {
      Object.assign(category, patch)
      touch()
    }
  }

  function moveCategory(fromClassificationId: string, categoryId: string, toClassificationId: string) {
    if (!data.value || fromClassificationId === toClassificationId) return
    const from = data.value.classifications.find((c) => c.id === fromClassificationId)
    const to = data.value.classifications.find((c) => c.id === toClassificationId)
    if (!from || !to) return
    const index = from.categories.findIndex((cat) => cat.id === categoryId)
    if (index === -1) return
    const [category] = from.categories.splice(index, 1)
    to.categories.push(category!)
    touch()
  }

  return {
    state,
    ready,
    syncing,
    syncError,
    isCloud,
    usdRate,
    activePlan,
    data,
    totals,
    totalBr,
    totalUsd,
    totalPlanned,
    init,
    loadFromCloud,
    onUserSignedIn,
    onUserSignedOut,
    switchPlan,
    createPlan,
    deletePlan,
    savePlan,
    setUsdRate,
    setCompanyName,
    addClassification,
    removeClassification,
    updateClassification,
    addCategory,
    removeCategory,
    updateCategory,
    moveCategory,
  }
})

export const useClassificationStore = usePlansStore
