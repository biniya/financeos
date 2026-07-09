<script setup lang="ts">
import { BRAND_CLASSIFICATION_COLORS } from '@/brand/tokens'
import { hexToRgba } from '@/utils/color'
import { formatNumber } from '@/utils/format'
import type { CategoryTotal } from '@/types/transactions'

defineProps<{ items: CategoryTotal[] }>()

function colorFor(index: number) {
  return BRAND_CLASSIFICATION_COLORS[index % BRAND_CLASSIFICATION_COLORS.length]!
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <div
      v-for="(item, i) in items"
      :key="item.name"
      class="rounded-2xl px-4 py-3 ring-1 ring-black/[0.06]"
      :style="{
        backgroundColor: hexToRgba(colorFor(i), 0.1),
        borderLeft: `3px solid ${colorFor(i)}`,
      }"
    >
      <p class="truncate text-sm font-semibold text-ink">{{ item.name }}</p>
      <p class="mt-1 font-mono-nums text-lg font-bold text-ink">Br {{ formatNumber(item.amount) }}</p>
      <p class="mt-0.5 text-[11px] text-muted">{{ item.count }} transaction{{ item.count === 1 ? '' : 's' }}</p>
    </div>
  </div>
</template>
