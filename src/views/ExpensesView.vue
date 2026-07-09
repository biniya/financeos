<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Transaction } from '@/types/transactions'
import InvestorSummary from '@/components/expenses/InvestorSummary.vue'
import InvestorMonthlyChart from '@/components/expenses/InvestorMonthlyChart.vue'
import ClassificationSpendRow from '@/components/expenses/ClassificationSpendRow.vue'
import TransactionLedger from '@/components/expenses/TransactionLedger.vue'
import ImportPanel from '@/components/expenses/ImportPanel.vue'
import CategorizeInbox from '@/components/expenses/CategorizeInbox.vue'
import TransactionEditor from '@/components/expenses/TransactionEditor.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { ArrowUpTrayIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

type Tab = 'inbox' | 'overview' | 'all'

const store = useTransactionsStore()
const tab = ref<Tab>('overview')
const showImport = ref(false)
const importMessage = ref('')
const editorOpen = ref(false)
const editorMode = ref<'add' | 'edit'>('add')
const editingTx = ref<Transaction | null>(null)
const confirmReset = ref(false)
const resetting = ref(false)

const hasData = computed(() => store.transactions.length > 0)

watch(
  () => store.inboxCount,
  (count) => {
    if (count > 0 && tab.value === 'overview') tab.value = 'inbox'
  },
)

function onImported(result: { imported: number; skipped: number; errors: string[] }) {
  importMessage.value = `Imported ${result.imported} rows${result.skipped ? `, skipped ${result.skipped} duplicates` : ''}. Categorize them in the inbox.`
  showImport.value = false
  tab.value = 'inbox'
  setTimeout(() => { importMessage.value = '' }, 5000)
}

function openAdd() {
  editorMode.value = 'add'
  editingTx.value = null
  editorOpen.value = true
}

function openEdit(tx: Transaction) {
  editorMode.value = 'edit'
  editingTx.value = tx
  editorOpen.value = true
}

function openCategorize(tx: Transaction) {
  openEdit(tx)
}

async function onSave(payload: Omit<Transaction, 'importedAt'>) {
  if (editorMode.value === 'add') {
    await store.addTransaction(payload)
  } else {
    await store.updateTransaction(payload.id, payload)
  }
  editorOpen.value = false
}

function closeEditor() {
  editorOpen.value = false
}

async function resetExpenses() {
  resetting.value = true
  try {
    await store.clearAll()
    confirmReset.value = false
    tab.value = 'overview'
    showImport.value = false
    importMessage.value = 'All expense data cleared. Import a fresh CSV to start over.'
    setTimeout(() => { importMessage.value = '' }, 5000)
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-8 sm:px-5 lg:px-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="font-display text-xl font-semibold text-ink sm:text-2xl">Expenses</h1>
        <p class="mt-1 text-sm text-muted">
          <template v-if="tab === 'overview'">Financial snapshot for stakeholders.</template>
          <template v-else>Import your bank CSV, categorize each row yourself, then see where money went.</template>
        </p>
      </div>
      <div class="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <button
          v-if="hasData"
          type="button"
          class="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
          @click="confirmReset = true"
        >
          <TrashIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Reset expenses</span>
          <span class="sm:hidden">Reset</span>
        </button>
        <button type="button" class="btn-secondary flex-1 sm:flex-none" @click="openAdd">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Add transaction</span>
          <span class="sm:hidden">Add</span>
        </button>
        <button type="button" class="btn-primary flex-1 sm:flex-none" @click="showImport = !showImport">
          <ArrowUpTrayIcon class="h-4 w-4" />
          {{ showImport ? 'Close' : 'Import' }}
        </button>
      </div>
    </div>

    <p v-if="importMessage" class="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
      {{ importMessage }}
    </p>

    <ImportPanel v-if="showImport" @imported="onImported" />

    <div v-if="hasData" class="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
      <button
        type="button"
        class="min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
        :class="tab === 'inbox' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'inbox'"
      >
        Inbox
        <span
          v-if="store.inboxCount"
          class="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {{ store.inboxCount }}
        </span>
      </button>
      <button
        type="button"
        class="min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
        :class="tab === 'overview' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'overview'"
      >
        Overview
      </button>
      <button
        type="button"
        class="min-w-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
        :class="tab === 'all' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'all'"
      >
        <span class="sm:hidden">All</span>
        <span class="hidden sm:inline">All transactions</span>
      </button>
    </div>

    <template v-if="hasData">
      <CategorizeInbox v-if="tab === 'inbox'" />

      <template v-else-if="tab === 'overview'">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-muted">
            <template v-if="store.overviewExpenseMode === 'recurring'">
              Showing operating expenses — one-time purchases excluded.
            </template>
            <template v-else>
              Showing all expenses, including one-time purchases.
            </template>
          </p>
          <div class="segmented w-full sm:w-auto">
            <button
              type="button"
              class="segmented-btn flex-1 justify-center"
              :class="store.overviewExpenseMode === 'all' ? 'segmented-btn-active' : ''"
              @click="store.overviewExpenseMode = 'all'"
            >
              <span class="hidden sm:inline">All expenses</span>
              <span class="sm:hidden">All</span>
            </button>
            <button
              type="button"
              class="segmented-btn flex-1 justify-center"
              :class="store.overviewExpenseMode === 'recurring' ? 'segmented-btn-active' : ''"
              @click="store.overviewExpenseMode = 'recurring'"
            >
              <span class="hidden sm:inline">Exclude one-time</span>
              <span class="sm:hidden">Recurring</span>
            </button>
          </div>
        </div>
        <InvestorSummary />
        <InvestorMonthlyChart />
        <div>
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Spend by area</h2>
          <ClassificationSpendRow :items="store.byClassification" />
        </div>
      </template>

      <TransactionLedger
        v-else
        @edit="openEdit"
        @categorize="openCategorize"
      />
    </template>

    <div v-else-if="!showImport" class="card py-16 text-center">
      <p class="text-sm font-medium text-ink">Start with a CSV or add a transaction</p>
      <p class="mt-2 text-sm text-muted">Import from your bank, then categorize each row in the inbox — your way.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" class="btn-primary" @click="showImport = true">Import CSV</button>
        <button type="button" class="btn-secondary" @click="openAdd">Add manually</button>
      </div>
    </div>

    <TransactionEditor
      v-if="editorOpen"
      :transaction="editingTx"
      :mode="editorMode"
      @save="onSave"
      @cancel="closeEditor"
    />

    <div
      v-if="confirmReset"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      @click.self="confirmReset = false"
    >
      <div class="card w-full max-w-md p-6 shadow-2xl" role="dialog" aria-modal="true">
        <h2 class="font-display text-lg font-semibold text-ink">Reset all expenses?</h2>
        <p class="mt-2 text-sm text-muted">
          This deletes every imported and manual transaction{{ store.isCloud ? ' from your account' : '' }}.
          Your Plan data is not affected. This cannot be undone.
        </p>
        <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-200">
          {{ store.transactions.length }} transaction{{ store.transactions.length === 1 ? '' : 's' }} will be removed.
        </p>
        <div class="mt-6 flex gap-2">
          <button type="button" class="btn-secondary flex-1" :disabled="resetting" @click="confirmReset = false">
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 rounded-[10px] bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            :disabled="resetting"
            @click="resetExpenses"
          >
            {{ resetting ? 'Resetting…' : 'Reset everything' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
