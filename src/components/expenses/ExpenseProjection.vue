<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { BRAND_CLASSIFICATION_COLORS } from '@/brand/tokens'
import { hexToRgba } from '@/utils/color'
import { formatNumber } from '@/utils/format'
import { format, parseISO } from 'date-fns'

const store = useTransactionsStore()

const rangeLabel = computed(() => {
  if (!store.range) return ''
  const min = format(parseISO(store.range.min), 'MMM yyyy')
  const max = format(parseISO(store.range.max), 'MMM yyyy')
  return min === max ? min : `${min} – ${max}`
})

const projectedQuarterly = computed(() => store.projectedMonthlyTotal * 3)

function colorFor(index: number) {
  return BRAND_CLASSIFICATION_COLORS[index % BRAND_CLASSIFICATION_COLORS.length]!
}

function sharePct(monthly: number) {
  if (!store.projectedMonthlyTotal) return 0
  return Math.round((monthly / store.projectedMonthlyTotal) * 100)
}
</script>

<template>
  <div class="space-y-6">
    <div class="card overflow-hidden">
      <div class="border-b border-line bg-surface px-5 py-4">
        <h2 class="font-display text-lg font-semibold text-ink">Projected monthly spend</h2>
        <p class="mt-1 text-sm text-muted">
          Based on {{ store.expenseMonths }} month{{ store.expenseMonths === 1 ? '' : 's' }} of recurring expenses
          <span v-if="rangeLabel"> ({{ rangeLabel }})</span>
        </p>
      </div>

      <div class="grid gap-4 px-5 py-6 sm:grid-cols-2">
        <div class="rounded-xl bg-brand px-5 py-4 text-brand-fg">
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Monthly burn</p>
          <p class="mt-2 font-mono-nums text-3xl font-bold">Br {{ formatNumber(store.projectedMonthlyTotal) }}</p>
          <p class="mt-1 text-xs text-white/40">Recurring operating expenses</p>
        </div>
        <div class="rounded-xl bg-surface-2 px-5 py-4 ring-1 ring-line">
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Quarterly outlook</p>
          <p class="mt-2 font-mono-nums text-3xl font-bold text-ink">Br {{ formatNumber(projectedQuarterly) }}</p>
          <p class="mt-1 text-xs text-muted">Monthly burn × 3 months</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-muted">By classification</h3>
      <div class="card overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-line bg-surface-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th class="px-5 py-3">Area</th>
              <th class="px-5 py-3 text-right">Monthly avg</th>
              <th class="px-5 py-3 text-right">Share</th>
              <th class="px-5 py-3 text-right hidden sm:table-cell">Period total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in store.projectionByClassification"
              :key="item.name"
              class="border-b border-line/60"
            >
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: colorFor(i) }"
                  />
                  <span class="font-medium text-ink">{{ item.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-right font-mono-nums font-semibold text-ink">
                Br {{ formatNumber(item.monthlyAverage) }}
              </td>
              <td class="px-5 py-3 text-right text-muted">{{ sharePct(item.monthlyAverage) }}%</td>
              <td class="hidden px-5 py-3 text-right font-mono-nums text-muted sm:table-cell">
                Br {{ formatNumber(item.totalInPeriod) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-surface font-semibold">
            <tr>
              <td class="px-5 py-3 text-ink">Total</td>
              <td class="px-5 py-3 text-right font-mono-nums text-ink">
                Br {{ formatNumber(store.projectedMonthlyTotal) }}
              </td>
              <td class="px-5 py-3 text-right text-muted">100%</td>
              <td class="hidden px-5 py-3 sm:table-cell" />
            </tr>
          </tfoot>
        </table>

        <p v-if="!store.projectionByClassification.length" class="px-5 py-12 text-center text-sm text-muted">
          Categorize recurring expenses to see projections.
        </p>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(item, i) in store.projectionByClassification"
        :key="item.name"
        class="rounded-2xl px-4 py-3 ring-1 ring-black/[0.06]"
        :style="{
          backgroundColor: hexToRgba(colorFor(i), 0.1),
          borderLeft: `3px solid ${colorFor(i)}`,
        }"
      >
        <p class="truncate text-sm font-semibold text-ink">{{ item.name }}</p>
        <p class="mt-1 font-mono-nums text-lg font-bold text-ink">Br {{ formatNumber(item.monthlyAverage) }}/mo</p>
        <p class="mt-0.5 text-[11px] text-muted">{{ sharePct(item.monthlyAverage) }}% of monthly burn</p>
      </div>
    </div>
  </div>
</template>
