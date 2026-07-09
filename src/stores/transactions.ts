import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ImportOptions,
  ImportResult,
  OverviewExpenseMode,
  Transaction,
  TransactionPatch,
} from '@/types/transactions'
import { isUncategorized } from '@/types/transactions'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  deleteAllTransactionsRemote,
  deleteTransactionRemote,
  fetchTransactions,
  upsertTransaction,
  upsertTransactions,
} from '@/services/transactionsService'
import { useAuthStore } from '@/stores/auth'
import { dedupeImport, parseTransactionsCsv } from '@/utils/csvImport'
import {
  dateRange,
  expenseMonthsCount,
  filterForOverview,
  groupByCategory,
  groupByClassification,
  groupByMonth,
  projectMonthlyByClassification,
  sumByType,
  sumOneTimeExpenses,
  uncategorizedTransactions,
  uniqueValues,
} from '@/utils/transactionAnalytics'
import { now, uid } from '@/utils/planHelpers'

const LOCAL_KEY = 'financeos-transactions'

function loadLocal(): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Transaction[]
  } catch {
    return []
  }
}

function saveLocal(txs: Transaction[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(txs))
}

function sortTransactions(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date))
}

export const useTransactionsStore = defineStore('transactions', () => {
  const auth = useAuthStore()

  const transactions = ref<Transaction[]>([])
  const ready = ref(false)
  const syncing = ref(false)
  const syncError = ref<string | null>(null)
  const overviewExpenseMode = ref<OverviewExpenseMode>('recurring')

  let syncTimer: ReturnType<typeof setTimeout> | null = null

  const isCloud = computed(() => isSupabaseConfigured && auth.isAuthenticated)
  const inbox = computed(() => uncategorizedTransactions(transactions.value))
  const inboxCount = computed(() => inbox.value.length)
  const categorizedCount = computed(() => transactions.value.length - inboxCount.value)
  const totalExpenses = computed(() => sumByType(transactions.value, 'expense'))
  const totalRecurringExpenses = computed(() =>
    sumByType(transactions.value, 'expense', { excludeOneTime: true }),
  )
  const totalOneTimeExpenses = computed(() => sumOneTimeExpenses(transactions.value))
  const totalIncome = computed(() => sumByType(transactions.value, 'income'))
  const netFlow = computed(() => totalIncome.value - totalExpenses.value)
  const netFlowRecurring = computed(() => totalIncome.value - totalRecurringExpenses.value)
  const filteredForOverview = computed(() =>
    filterForOverview(transactions.value, overviewExpenseMode.value),
  )
  const recurringTransactions = computed(() => filterForOverview(transactions.value, 'recurring'))
  const byCategory = computed(() => groupByCategory(filteredForOverview.value, 'expense'))
  const byClassification = computed(() => groupByClassification(filteredForOverview.value, 'expense'))
  const byMonth = computed(() => groupByMonth(filteredForOverview.value))
  const byMonthRecurring = computed(() => groupByMonth(recurringTransactions.value))
  const byClassificationRecurring = computed(() => groupByClassification(recurringTransactions.value, 'expense'))
  const range = computed(() => dateRange(transactions.value))
  const categories = computed(() => uniqueValues(transactions.value, 'category'))
  const classifications = computed(() => uniqueValues(transactions.value, 'classification'))
  const expenseMonths = computed(() => expenseMonthsCount(transactions.value))
  const projectionByClassification = computed(() => projectMonthlyByClassification(transactions.value))
  const projectedMonthlyTotal = computed(() =>
    projectionByClassification.value.reduce((s, p) => s + p.monthlyAverage, 0),
  )

  function persistLocal() {
    saveLocal(transactions.value)
  }

  async function syncOne(tx: Transaction) {
    if (!isCloud.value || !auth.user) {
      persistLocal()
      return
    }
    syncing.value = true
    try {
      await upsertTransaction(auth.user.id, tx)
      syncError.value = null
    } catch (e) {
      syncError.value = e instanceof Error ? e.message : 'Sync failed'
      persistLocal()
    } finally {
      syncing.value = false
    }
  }

  async function loadFromCloud(userId: string) {
    syncing.value = true
    syncError.value = null
    try {
      let txs = await fetchTransactions(userId)

      if (!txs.length) {
        const local = loadLocal()
        if (local.length) {
          await upsertTransactions(userId, local)
          txs = await fetchTransactions(userId)
          localStorage.removeItem(LOCAL_KEY)
        }
      }

      transactions.value = txs
    } catch (e) {
      syncError.value = e instanceof Error ? e.message : 'Failed to load transactions'
      transactions.value = loadLocal()
    } finally {
      syncing.value = false
    }
  }

  async function init() {
    ready.value = false

    if (!isSupabaseConfigured) {
      transactions.value = loadLocal()
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
    transactions.value = []
    syncError.value = null
  }

  function scheduleSync() {
    if (!isCloud.value) {
      persistLocal()
      return
    }
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(async () => {
      if (!auth.user) return
      syncing.value = true
      try {
        await upsertTransactions(auth.user.id, transactions.value)
        syncError.value = null
      } catch (e) {
        syncError.value = e instanceof Error ? e.message : 'Sync failed'
      } finally {
        syncing.value = false
      }
    }, 600)
  }

  function touch() {
    scheduleSync()
  }

  function getById(id: string): Transaction | undefined {
    return transactions.value.find((t) => t.id === id)
  }

  function applyPatch(id: string, patch: TransactionPatch): Transaction | null {
    const idx = transactions.value.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const updated = { ...transactions.value[idx]!, ...patch }
    if (updated.type === 'income') updated.isOneTime = false
    transactions.value = sortTransactions([
      ...transactions.value.slice(0, idx),
      updated,
      ...transactions.value.slice(idx + 1),
    ])
    return updated
  }

  async function updateTransaction(id: string, patch: TransactionPatch) {
    const updated = applyPatch(id, patch)
    if (!updated) return
    await syncOne(updated)
  }

  async function categorizeTransaction(
    id: string,
    category: string,
    classification: string,
    isOneTime?: boolean,
  ) {
    const patch: TransactionPatch = {
      category: category.trim(),
      classification: classification.trim(),
      importHint: undefined,
    }
    if (isOneTime !== undefined) patch.isOneTime = isOneTime
    await updateTransaction(id, patch)
  }

  function createEmptyTransaction(): Transaction {
    const today = new Date().toISOString().slice(0, 10)
    return {
      id: uid(),
      date: today,
      account: '',
      category: '',
      classification: '',
      type: 'expense',
      currency: 'Br',
      amount: 0,
      reporting: 'unreported',
      description: '',
      reference: '',
      isOneTime: false,
      importedAt: now(),
    }
  }

  async function addTransaction(input: Omit<Transaction, 'id' | 'importedAt'> & { id?: string }) {
    const tx: Transaction = {
      ...createEmptyTransaction(),
      ...input,
      id: input.id ?? uid(),
      importedAt: now(),
      isOneTime: input.type === 'income' ? false : (input.isOneTime ?? false),
    }
    transactions.value = sortTransactions([tx, ...transactions.value])
    await syncOne(tx)
    return tx
  }

  async function importCsv(text: string, options: ImportOptions = {}): Promise<ImportResult> {
    const parsed = parseTransactionsCsv(text, options)
    if (!parsed.transactions.length) return parsed

    const { toAdd, skipped } = dedupeImport(parsed.transactions, transactions.value)
    transactions.value = sortTransactions([...toAdd, ...transactions.value])

    if (isCloud.value && auth.user) {
      syncing.value = true
      try {
        await upsertTransactions(auth.user.id, toAdd)
        syncError.value = null
      } catch (e) {
        syncError.value = e instanceof Error ? e.message : 'Import sync failed'
        persistLocal()
      } finally {
        syncing.value = false
      }
    } else {
      persistLocal()
    }

    return { ...parsed, imported: toAdd.length, skipped }
  }

  async function removeTransaction(id: string) {
    transactions.value = transactions.value.filter((t) => t.id !== id)
    if (isCloud.value && auth.user) {
      try {
        await deleteTransactionRemote(id)
      } catch (e) {
        syncError.value = e instanceof Error ? e.message : 'Delete failed'
      }
    } else {
      persistLocal()
    }
  }

  async function clearAll() {
    transactions.value = []
    if (isCloud.value && auth.user) {
      try {
        await deleteAllTransactionsRemote(auth.user.id)
      } catch (e) {
        syncError.value = e instanceof Error ? e.message : 'Clear failed'
      }
    } else {
      persistLocal()
    }
  }

  return {
    transactions,
    ready,
    syncing,
    syncError,
    overviewExpenseMode,
    isCloud,
    inbox,
    inboxCount,
    categorizedCount,
    totalExpenses,
    totalRecurringExpenses,
    totalOneTimeExpenses,
    totalIncome,
    netFlow,
    netFlowRecurring,
    filteredForOverview,
    byCategory,
    byClassification,
    byMonth,
    byMonthRecurring,
    byClassificationRecurring,
    range,
    categories,
    classifications,
    expenseMonths,
    projectionByClassification,
    projectedMonthlyTotal,
    init,
    onUserSignedIn,
    onUserSignedOut,
    importCsv,
    addTransaction,
    updateTransaction,
    categorizeTransaction,
    createEmptyTransaction,
    getById,
    removeTransaction,
    clearAll,
    touch,
    isUncategorized,
  }
})
