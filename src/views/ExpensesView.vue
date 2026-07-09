<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Transaction } from '@/types/transactions'
import ExpensesSummary from '@/components/expenses/ExpensesSummary.vue'
import ExpensesCharts from '@/components/expenses/ExpensesCharts.vue'
import ClassificationSpendRow from '@/components/expenses/ClassificationSpendRow.vue'
import TransactionLedger from '@/components/expenses/TransactionLedger.vue'
import ImportPanel from '@/components/expenses/ImportPanel.vue'
import CategorizeInbox from '@/components/expenses/CategorizeInbox.vue'
import TransactionEditor from '@/components/expenses/TransactionEditor.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/vue/24/outline'

type Tab = 'inbox' | 'overview' | 'all'

const store = useTransactionsStore()
const tab = ref<Tab>('inbox')
const showImport = ref(false)
const importMessage = ref('')
const editorOpen = ref(false)
const editorMode = ref<'add' | 'edit'>('add')
const editingTx = ref<Transaction | null>(null)

const hasData = computed(() => store.transactions.length > 0)

watch(
  () => store.inboxCount,
  (count) => {
    if (count > 0 && tab.value === 'overview' && !hasData.value) tab.value = 'inbox'
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
</script>

<template>
  <main class="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-ink">Expenses</h1>
        <p class="mt-1 text-sm text-muted">Import your bank CSV, categorize each row yourself, then see where money went.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="openAdd">
          <PlusIcon class="h-4 w-4" />
          Add transaction
        </button>
        <button type="button" class="btn-primary" @click="showImport = !showImport">
          <ArrowUpTrayIcon class="h-4 w-4" />
          {{ showImport ? 'Close import' : 'Import CSV' }}
        </button>
      </div>
    </div>

    <p v-if="importMessage" class="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
      {{ importMessage }}
    </p>

    <ImportPanel v-if="showImport" @imported="onImported" />

    <div v-if="hasData" class="flex gap-1 rounded-xl bg-surface-2 p-1">
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition"
        :class="tab === 'inbox' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'inbox'"
      >
        Inbox
        <span
          v-if="store.inboxCount"
          class="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {{ store.inboxCount }}
        </span>
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition"
        :class="tab === 'overview' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'overview'"
      >
        Overview
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition"
        :class="tab === 'all' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'"
        @click="tab = 'all'"
      >
        All transactions
      </button>
    </div>

    <template v-if="hasData">
      <CategorizeInbox v-if="tab === 'inbox'" />
      <template v-else-if="tab === 'overview'">
        <ExpensesSummary />
        <p v-if="store.inboxCount" class="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          {{ store.inboxCount }} transactions still need categories — charts only include categorized rows.
        </p>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs font-bold uppercase tracking-wider text-muted">Chart view</p>
          <div class="segmented">
            <button
              type="button"
              class="segmented-btn"
              :class="store.overviewExpenseMode === 'all' ? 'segmented-btn-active' : ''"
              @click="store.overviewExpenseMode = 'all'"
            >
              All expenses
            </button>
            <button
              type="button"
              class="segmented-btn"
              :class="store.overviewExpenseMode === 'recurring' ? 'segmented-btn-active' : ''"
              @click="store.overviewExpenseMode = 'recurring'"
            >
              Exclude one-time
            </button>
          </div>
        </div>
        <ExpensesCharts />
        <div>
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Spend by classification</h2>
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
  </main>
</template>
