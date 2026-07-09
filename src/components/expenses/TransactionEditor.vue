<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Transaction } from '@/types/transactions'
import { useCategorySuggestions } from '@/composables/useCategorySuggestions'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  transaction?: Transaction | null
  mode?: 'add' | 'edit'
}>()

const emit = defineEmits<{
  save: [payload: Omit<Transaction, 'importedAt'>]
  cancel: []
}>()

const { classificationOptions, categoriesForClassification } = useCategorySuggestions()

const date = ref('')
const account = ref('')
const category = ref('')
const classification = ref('')
const type = ref<'expense' | 'income'>('expense')
const currency = ref<'Br' | 'USD'>('Br')
const amount = ref('')
const reporting = ref<'unreported' | 'reported'>('unreported')
const description = ref('')
const reference = ref('')

const categoryList = computed(() => categoriesForClassification(classification.value))

watch(
  () => props.transaction,
  (tx) => {
    if (!tx) {
      const today = new Date().toISOString().slice(0, 10)
      date.value = today
      account.value = ''
      category.value = ''
      classification.value = ''
      type.value = 'expense'
      currency.value = 'Br'
      amount.value = ''
      reporting.value = 'unreported'
      description.value = ''
      reference.value = ''
      return
    }
    date.value = tx.date
    account.value = tx.account
    category.value = tx.category
    classification.value = tx.classification
    type.value = tx.type
    currency.value = tx.currency
    amount.value = String(tx.amount || '')
    reporting.value = tx.reporting
    description.value = tx.description
    reference.value = tx.reference
  },
  { immediate: true },
)

function submit() {
  const parsed = parseFloat(amount.value.replace(/,/g, ''))
  if (!date.value || !Number.isFinite(parsed)) return

  emit('save', {
    id: props.transaction?.id ?? crypto.randomUUID(),
    date: date.value,
    account: account.value.trim(),
    category: category.value.trim(),
    classification: classification.value.trim(),
    type: type.value,
    currency: currency.value,
    amount: parsed,
    reporting: reporting.value,
    description: description.value.trim(),
    reference: reference.value.trim(),
    importHint: undefined,
  })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" @click.self="emit('cancel')">
    <div class="card w-full max-w-lg overflow-hidden shadow-2xl" role="dialog" aria-modal="true">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 class="font-display text-lg font-semibold text-ink">
          {{ mode === 'add' ? 'Add transaction' : 'Edit transaction' }}
        </h2>
        <button type="button" class="rounded-lg p-1 text-muted hover:bg-surface" @click="emit('cancel')">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <form class="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4" @submit.prevent="submit">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block text-xs font-semibold text-muted">
            Date
            <input v-model="date" type="date" required class="input-field mt-1 w-full" />
          </label>
          <label class="block text-xs font-semibold text-muted">
            Amount
            <input v-model="amount" type="text" inputmode="decimal" required placeholder="0.00" class="input-field mt-1 w-full font-mono-nums" />
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block text-xs font-semibold text-muted">
            Type
            <select v-model="type" class="input-field mt-1 w-full">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label class="block text-xs font-semibold text-muted">
            Currency
            <select v-model="currency" class="input-field mt-1 w-full">
              <option value="Br">Br (ETB)</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <label class="block text-xs font-semibold text-muted">
          Description
          <input v-model="description" type="text" class="input-field mt-1 w-full" placeholder="What was this for?" />
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block text-xs font-semibold text-muted">
            Classification
            <input
              v-model="classification"
              type="text"
              list="classification-suggestions"
              class="input-field mt-1 w-full"
              placeholder="e.g. Variable recurring"
            />
            <datalist id="classification-suggestions">
              <option v-for="c in classificationOptions" :key="c" :value="c" />
            </datalist>
          </label>
          <label class="block text-xs font-semibold text-muted">
            Category
            <input
              v-model="category"
              type="text"
              list="category-suggestions"
              class="input-field mt-1 w-full"
              placeholder="e.g. Coffee, Rent"
            />
            <datalist id="category-suggestions">
              <option v-for="c in categoryList" :key="c" :value="c" />
            </datalist>
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block text-xs font-semibold text-muted">
            Account
            <input v-model="account" type="text" class="input-field mt-1 w-full" placeholder="Optional" />
          </label>
          <label class="block text-xs font-semibold text-muted">
            Reference
            <input v-model="reference" type="text" class="input-field mt-1 w-full" placeholder="Optional" />
          </label>
        </div>

        <label class="block text-xs font-semibold text-muted">
          Reporting
          <select v-model="reporting" class="input-field mt-1 w-full">
            <option value="unreported">Unreported</option>
            <option value="reported">Reported</option>
          </select>
        </label>

        <p v-if="transaction?.importHint" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Bank export suggested: <strong>{{ transaction.importHint }}</strong>
        </p>

        <div class="flex gap-2 border-t border-line pt-4">
          <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
          <button type="submit" class="btn-primary flex-1">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>
