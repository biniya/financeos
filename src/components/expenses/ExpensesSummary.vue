<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { formatNumber } from '@/utils/format'
import { format, parseISO } from 'date-fns'

const store = useTransactionsStore()

const rangeLabel = computed(() => {
  if (!store.range) return 'No data'
  const min = format(parseISO(store.range.min), 'MMM d, yyyy')
  const max = format(parseISO(store.range.max), 'MMM d, yyyy')
  return min === max ? min : `${min} – ${max}`
})
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/20 ring-1 ring-white/10">
    <div class="absolute inset-x-0 top-0 h-1 bg-accent" />

    <div class="relative grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Money in</p>
        <p class="mt-1 font-mono-nums text-xl font-semibold text-emerald-300">Br {{ formatNumber(store.totalIncome) }}</p>
      </div>

      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Money out</p>
        <p class="mt-1 font-mono-nums text-xl font-semibold text-red-300">Br {{ formatNumber(store.totalExpenses) }}</p>
      </div>

      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Net flow</p>
        <p
          class="mt-1 font-mono-nums text-xl font-semibold"
          :class="store.netFlow >= 0 ? 'text-emerald-300' : 'text-red-300'"
        >
          Br {{ formatNumber(store.netFlow) }}
        </p>
      </div>

      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Transactions</p>
        <p class="mt-1 text-sm font-semibold">{{ store.categorizedCount }} categorized</p>
        <p v-if="store.inboxCount" class="mt-0.5 text-[11px] text-amber-300">{{ store.inboxCount }} in inbox</p>
        <p v-else class="mt-0.5 text-[11px] text-white/40">{{ rangeLabel }}</p>
      </div>
    </div>
  </div>
</template>
