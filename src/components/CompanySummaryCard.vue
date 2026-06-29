<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyTotals } from '@/types'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  totals: CurrencyTotals
  companyName: string
  editorVisible: boolean
  exchangeRate?: number
}>()

const emit = defineEmits<{ 'update:name': [value: string] }>()

const combinedBr = computed(() => {
  if (!props.exchangeRate) return props.totals.Br
  return props.totals.Br + props.totals.USD * props.exchangeRate
})

function fmt(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="w-full max-w-[300px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg shadow-slate-900/15 ring-1 ring-white/10">
    <!-- Header + combined in one row -->
    <div class="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2.5">
      <div class="min-w-0 flex-1">
        <input
          v-if="editorVisible"
          :value="companyName"
          placeholder="Company"
          class="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30"
          @input="emit('update:name', ($event.target as HTMLInputElement).value)"
        />
        <p v-else class="truncate text-sm font-semibold text-white" data-company-name>
          {{ companyName || 'Untitled' }}
        </p>
      </div>
      <div v-if="exchangeRate" class="shrink-0 text-right">
        <p class="text-[9px] text-white/40">Total</p>
        <p class="text-sm font-bold tabular-nums text-white">
          {{ formatAmount(combinedBr, 'Br') }}
        </p>
      </div>
    </div>

    <!-- Breakdown -->
    <div class="grid grid-cols-2 divide-x divide-white/10 px-1 py-2">
      <div class="px-2.5 text-center">
        <p class="text-[9px] text-teal-400/80">Birr</p>
        <p class="text-xs font-semibold tabular-nums text-white">Br {{ fmt(totals.Br) }}</p>
      </div>
      <div class="px-2.5 text-center">
        <p class="text-[9px] text-sky-400/80">USD</p>
        <p class="text-xs font-semibold tabular-nums text-white">USD {{ fmt(totals.USD) }}</p>
      </div>
    </div>

    <p
      v-if="exchangeRate && totals.USD > 0"
      class="border-t border-white/5 px-3 py-1 text-center text-[9px] text-white/30"
    >
      USD × {{ exchangeRate }} Br/USD
    </p>
  </div>
</template>
