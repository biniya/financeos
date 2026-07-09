<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useCategorySuggestions } from '@/composables/useCategorySuggestions'
import { formatAmount } from '@/utils/format'
import { format, parseISO } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const store = useTransactionsStore()
const { classificationOptions, categoriesForClassification } = useCategorySuggestions()

const index = ref(0)
const classification = ref('')
const category = ref('')
const isOneTime = ref(false)
const saving = ref(false)

const queue = computed(() => store.inbox)
const current = computed(() => queue.value[index.value] ?? null)
const remaining = computed(() => queue.value.length)
const progress = computed(() => {
  const total = store.transactions.length
  if (!total) return 0
  return Math.round((store.categorizedCount / total) * 100)
})

const categoryList = computed(() => categoriesForClassification(classification.value))

watch(current, (tx) => {
  if (!tx) return
  classification.value = tx.classification || ''
  category.value = tx.category || ''
  isOneTime.value = tx.isOneTime ?? false
  if (tx.importHint) {
    const parts = tx.importHint.split(' · ')
    if (!classification.value && parts.length > 1) classification.value = parts[parts.length - 1] ?? ''
    if (!category.value && parts[0]) category.value = parts[0]
  }
}, { immediate: true })

function fmtDate(date: string) {
  return format(parseISO(date), 'EEE, MMM d')
}

function pickClassification(name: string) {
  classification.value = name
}

function pickCategory(name: string) {
  category.value = name
}

async function saveAndNext() {
  if (!current.value) return
  if (!classification.value.trim() || !category.value.trim()) return
  saving.value = true
  try {
    await store.categorizeTransaction(
      current.value.id,
      category.value,
      classification.value,
      current.value.type === 'expense' ? isOneTime.value : false,
    )
    if (index.value >= store.inbox.length) index.value = Math.max(0, store.inbox.length - 1)
  } finally {
    saving.value = false
  }
}

function skip() {
  if (index.value < queue.value.length - 1) index.value++
  else index.value = 0
}

function prev() {
  if (index.value > 0) index.value--
}

function next() {
  if (index.value < queue.value.length - 1) index.value++
}
</script>

<template>
  <div v-if="!remaining" class="card py-12 text-center">
    <SparklesIcon class="mx-auto h-10 w-10 text-emerald-600" />
    <p class="mt-3 font-display text-lg font-semibold text-ink">Inbox clear</p>
    <p class="mt-1 text-sm text-muted">Every transaction is categorized. Check Overview for insights.</p>
  </div>

  <div v-else class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-muted">Categorize inbox</p>
        <p class="mt-0.5 text-sm text-ink">
          <span class="font-semibold text-brand">{{ remaining }}</span> left · {{ progress }}% done
        </p>
      </div>
      <div class="h-2 w-40 overflow-hidden rounded-full bg-surface-2">
        <div class="h-full rounded-full bg-brand transition-all" :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="border-b border-line bg-surface px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">{{ fmtDate(current!.date) }}</p>
            <p class="mt-1 font-display text-xl font-semibold text-ink">
              {{ current!.description || 'No description' }}
            </p>
            <p v-if="current!.account" class="mt-1 text-xs text-muted">{{ current!.account }}</p>
          </div>
          <div class="text-right">
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
              :class="current!.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
            >
              {{ current!.type }}
            </span>
            <p
              class="mt-2 font-mono-nums text-2xl font-bold"
              :class="current!.type === 'income' ? 'text-emerald-700' : 'text-ink'"
            >
              {{ formatAmount(current!.amount, current!.currency) }}
            </p>
          </div>
        </div>

        <p v-if="current!.importHint" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Your bank labeled this as: <strong>{{ current!.importHint }}</strong> — use it as a hint or ignore it.
        </p>
      </div>

      <div class="space-y-5 px-5 py-5">
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-muted">Classification</label>
          <input
            v-model="classification"
            type="text"
            list="inbox-classifications"
            class="input-field mt-2 w-full"
            placeholder="Pick or type your own"
          />
          <datalist id="inbox-classifications">
            <option v-for="c in classificationOptions" :key="c" :value="c" />
          </datalist>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="c in classificationOptions.slice(0, 6)"
              :key="c"
              type="button"
              class="rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition"
              :class="classification === c ? 'bg-brand text-brand-fg ring-brand' : 'bg-surface text-muted ring-line hover:ring-brand/40'"
              @click="pickClassification(c)"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-muted">Category</label>
          <input
            v-model="category"
            type="text"
            list="inbox-categories"
            class="input-field mt-2 w-full"
            placeholder="Name it anything you like"
          />
          <datalist id="inbox-categories">
            <option v-for="c in categoryList" :key="c" :value="c" />
          </datalist>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="c in categoryList.slice(0, 8)"
              :key="c"
              type="button"
              class="rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition"
              :class="category === c ? 'bg-accent text-white ring-accent' : 'bg-surface text-muted ring-line hover:ring-accent/40'"
              @click="pickCategory(c)"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <label v-if="current!.type === 'expense'" class="flex cursor-pointer items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <input
            v-model="isOneTime"
            type="checkbox"
            class="rounded border-line text-brand focus:ring-brand"
          />
          <span class="text-xs font-semibold text-ink">One-time expense</span>
        </label>

        <div class="flex flex-wrap gap-2 border-t border-line pt-4">
          <button type="button" class="btn-secondary" :disabled="index === 0" @click="prev">
            <ChevronLeftIcon class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="btn-primary flex-1"
            :disabled="saving || !classification.trim() || !category.trim()"
            @click="saveAndNext"
          >
            {{ saving ? 'Saving…' : 'Save & next' }}
          </button>
          <button type="button" class="btn-secondary" @click="skip">Skip</button>
          <button type="button" class="btn-secondary" :disabled="index >= remaining - 1" @click="next">
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
