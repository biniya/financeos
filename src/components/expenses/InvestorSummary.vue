<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { formatNumber } from '@/utils/format'
import { format, parseISO } from 'date-fns'

const store = useTransactionsStore()

const rangeLabel = computed(() => {
  if (!store.range) return ''
  const min = format(parseISO(store.range.min), 'MMM d, yyyy')
  const max = format(parseISO(store.range.max), 'MMM d, yyyy')
  return min === max ? min : `${min} – ${max}`
})

const excludeOneTime = computed(() => store.overviewExpenseMode === 'recurring')

const expenseHint = computed(() =>
  excludeOneTime.value
    ? 'Operating spend (one-time excluded)'
    : 'All expenses including one-time',
)

const netHint = computed(() =>
  excludeOneTime.value ? 'Income minus operating expenses' : 'Income minus all expenses',
)
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/20 ring-1 ring-white/10">
    <div class="absolute inset-x-0 top-0 h-1 bg-accent" />

    <div class="relative px-6 py-8">
      <p v-if="rangeLabel" class="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/45">
        {{ rangeLabel }}
      </p>

      <div class="mt-6 grid gap-6 sm:grid-cols-3">
        <div class="text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Income</p>
          <p class="mt-2 font-mono-nums text-3xl font-bold text-emerald-300 sm:text-4xl">
            Br {{ formatNumber(store.totalIncome) }}
          </p>
          <p class="mt-1 text-xs text-white/40">Money in</p>
        </div>

        <div class="text-center sm:border-x sm:border-white/10">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Expenses</p>
          <p class="mt-2 font-mono-nums text-3xl font-bold text-red-300 sm:text-4xl">
            Br {{ formatNumber(store.overviewExpenses) }}
          </p>
          <p class="mt-1 text-xs text-white/40">{{ expenseHint }}</p>
        </div>

        <div class="text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Net</p>
          <p
            class="mt-2 font-mono-nums text-3xl font-bold sm:text-4xl"
            :class="store.overviewNet >= 0 ? 'text-emerald-300' : 'text-red-300'"
          >
            Br {{ formatNumber(store.overviewNet) }}
          </p>
          <p class="mt-1 text-xs text-white/40">{{ netHint }}</p>
        </div>
      </div>

      <p
        v-if="store.totalOneTimeExpenses > 0 && excludeOneTime"
        class="mt-6 text-center text-xs text-white/35"
      >
        One-time excluded: Br {{ formatNumber(store.totalOneTimeExpenses) }}
        · All expenses would be Br {{ formatNumber(store.totalExpenses) }}
      </p>
      <p
        v-else-if="store.totalOneTimeExpenses > 0 && !excludeOneTime"
        class="mt-6 text-center text-xs text-white/35"
      >
        Includes one-time: Br {{ formatNumber(store.totalOneTimeExpenses) }}
        · Excluding one-time: Br {{ formatNumber(store.totalRecurringExpenses) }}
      </p>
    </div>
  </div>
</template>
