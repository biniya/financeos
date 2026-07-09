<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Transaction } from '@/types/transactions'
import { isOneTimeExpense, isUncategorized } from '@/types/transactions'
import { useTransactionsStore } from '@/stores/transactions'
import { formatAmount } from '@/utils/format'
import { format, parseISO } from 'date-fns'
import { PencilSquareIcon, TagIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  edit: [tx: Transaction]
  categorize: [tx: Transaction]
}>()

const store = useTransactionsStore()

const search = ref('')
const typeFilter = ref<'all' | 'expense' | 'income'>('all')
const categoryFilter = ref('all')
const classificationFilter = ref('all')
const monthFilter = ref('all')
const showUncategorizedOnly = ref(false)
const showOneTimeOnly = ref(false)
const expandedId = ref<string | null>(null)

const months = computed(() => {
  const set = new Set(store.transactions.map((t) => t.date.slice(0, 7)))
  return [...set].sort().reverse()
})

const filtered = computed(() => {
  let list = [...store.transactions]
  const q = search.value.trim().toLowerCase()

  if (typeFilter.value !== 'all') list = list.filter((t) => t.type === typeFilter.value)
  if (showUncategorizedOnly.value) list = list.filter(isUncategorized)
  if (showOneTimeOnly.value) list = list.filter(isOneTimeExpense)
  if (categoryFilter.value !== 'all') list = list.filter((t) => t.category.trim() === categoryFilter.value)
  if (classificationFilter.value !== 'all') list = list.filter((t) => t.classification.trim() === classificationFilter.value)
  if (monthFilter.value !== 'all') list = list.filter((t) => t.date.startsWith(monthFilter.value))

  if (q) {
    list = list.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.classification.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q),
    )
  }

  return list
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function fmtDate(date: string) {
  return format(parseISO(date), 'MMM d, yyyy')
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="border-b border-line bg-surface px-4 py-3">
      <h3 class="text-sm font-semibold text-ink">All transactions</h3>
      <div class="mt-3 flex flex-wrap gap-2">
        <input
          v-model="search"
          type="search"
          placeholder="Search description…"
          class="input-field !w-auto min-w-[160px] flex-1 !py-2 text-xs"
        />
        <select v-model="typeFilter" class="input-field !w-auto !py-2 text-xs">
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select v-model="categoryFilter" class="input-field !w-auto !py-2 text-xs">
          <option value="all">All categories</option>
          <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="classificationFilter" class="input-field !w-auto !py-2 text-xs">
          <option value="all">All classifications</option>
          <option v-for="c in store.classifications" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="monthFilter" class="input-field !w-auto !py-2 text-xs">
          <option value="all">All months</option>
          <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
        </select>
        <label class="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-muted">
          <input v-model="showOneTimeOnly" type="checkbox" class="rounded border-line text-brand" />
          One-time only
        </label>
        <label class="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-muted">
          <input v-model="showUncategorizedOnly" type="checkbox" class="rounded border-line text-brand" />
          Inbox only
        </label>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="border-b border-line bg-surface-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          <tr>
            <th class="px-4 py-2.5">Date</th>
            <th class="px-4 py-2.5">Category</th>
            <th class="px-4 py-2.5">Classification</th>
            <th class="px-4 py-2.5">Type</th>
            <th class="px-4 py-2.5 text-right">Amount</th>
            <th class="px-4 py-2.5">Description</th>
            <th class="px-4 py-2.5 w-24" />
          </tr>
        </thead>
        <tbody>
          <template v-for="tx in filtered" :key="tx.id">
            <tr
              class="cursor-pointer border-b border-line/60 transition hover:bg-surface"
              :class="isUncategorized(tx) ? 'bg-amber-50/40' : ''"
              @click="toggleExpand(tx.id)"
            >
              <td class="whitespace-nowrap px-4 py-2.5 text-muted">{{ fmtDate(tx.date) }}</td>
              <td class="px-4 py-2.5 font-medium" :class="tx.category.trim() ? 'text-ink' : 'text-amber-700'">
                {{ tx.category.trim() || 'Needs category' }}
              </td>
              <td class="px-4 py-2.5" :class="tx.classification.trim() ? 'text-muted' : 'text-amber-700'">
                {{ tx.classification.trim() || 'Needs classification' }}
              </td>
              <td class="px-4 py-2.5">
                <span
                  class="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  :class="tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
                >
                  {{ tx.type }}
                </span>
                <span
                  v-if="isOneTimeExpense(tx)"
                  class="ml-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800"
                >
                  One-time
                </span>
              </td>
              <td
                class="px-4 py-2.5 text-right font-mono-nums font-semibold"
                :class="tx.type === 'income' ? 'text-emerald-700' : 'text-ink'"
              >
                {{ formatAmount(tx.amount, tx.currency) }}
              </td>
              <td class="max-w-[200px] truncate px-4 py-2.5 text-muted">{{ tx.description || '—' }}</td>
              <td class="px-4 py-2.5">
                <div class="flex gap-1">
                  <button
                    v-if="isUncategorized(tx)"
                    type="button"
                    class="rounded-lg p-1.5 text-brand hover:bg-brand/10"
                    title="Categorize"
                    @click.stop="emit('categorize', tx)"
                  >
                    <TagIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-muted hover:bg-surface-2"
                    title="Edit"
                    @click.stop="emit('edit', tx)"
                  >
                    <PencilSquareIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="expandedId === tx.id" class="bg-surface">
              <td colspan="7" class="px-4 py-2 text-xs text-muted">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span v-if="tx.reference"><strong>Reference:</strong> {{ tx.reference }}</span>
                  <span v-if="tx.account"><strong>Account:</strong> {{ tx.account }}</span>
                  <span v-if="tx.importHint"><strong>Bank hint:</strong> {{ tx.importHint }}</span>
                  <button
                    class="text-red-600 hover:underline"
                    @click.stop="store.removeTransaction(tx.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <p v-if="!filtered.length" class="px-4 py-12 text-center text-sm text-muted">
        No transactions match your filters.
      </p>
    </div>
  </div>
</template>
