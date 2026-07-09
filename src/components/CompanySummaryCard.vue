<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyTotals } from '@/types'
import { formatAmount, formatNumber } from '@/utils/format'

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
</script>

<template>
  <div class="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/20 ring-1 ring-white/10">
    <div class="absolute inset-x-0 top-0 h-1 bg-accent" />

    <div class="relative flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
      <!-- Company -->
      <div class="min-w-0 shrink-0 sm:w-[180px]">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Company plan</p>
        <input
          v-if="editorVisible"
          :value="companyName"
          placeholder="Company name"
          class="mt-1 w-full bg-transparent font-display text-lg font-semibold tracking-tight text-white outline-none placeholder:text-white/25 sm:text-xl"
          @input="emit('update:name', ($event.target as HTMLInputElement).value)"
        />
        <h2 v-else class="mt-1 truncate font-display text-lg font-semibold tracking-tight sm:text-xl" data-company-name>
          {{ companyName || 'Untitled' }}
        </h2>
      </div>

      <!-- Combined total -->
      <div v-if="exchangeRate" class="min-w-0 flex-1 text-left sm:text-center">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/80">Combined total</p>
        <p class="mt-0.5 font-mono-nums text-2xl font-semibold tracking-tight sm:text-3xl">
          {{ formatAmount(combinedBr, 'Br') }}
        </p>
      </div>

      <!-- Currency breakdown -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="min-w-[7rem] flex-1 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-white/10 sm:flex-none">
          <p class="text-[9px] font-semibold uppercase tracking-wider text-white/45">Birr</p>
          <p class="mt-0.5 font-mono-nums text-sm font-semibold">Br {{ formatNumber(totals.Br) }}</p>
        </div>
        <div class="min-w-[7rem] flex-1 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-white/10 sm:flex-none">
          <p class="text-[9px] font-semibold uppercase tracking-wider text-white/45">USD</p>
          <p class="mt-0.5 font-mono-nums text-sm font-semibold">USD {{ formatNumber(totals.USD) }}</p>
        </div>
      </div>
    </div>

    <p
      v-if="exchangeRate && totals.USD > 0"
      class="border-t border-white/10 px-5 py-1.5 text-center text-[10px] text-white/35 sm:px-6"
    >
      USD converted at <span class="font-mono-nums text-accent/90">{{ exchangeRate }}</span> Br/USD
    </p>
  </div>
</template>
