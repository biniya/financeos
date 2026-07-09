<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useTransactionsStore } from '@/stores/transactions'
import { formatNumber } from '@/utils/format'

use([BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const store = useTransactionsStore()

const CHART_HEIGHT = 260

const chartCaption = computed(() =>
  store.overviewExpenseMode === 'recurring'
    ? 'Operating expenses only — one-time excluded'
    : 'All expenses including one-time purchases',
)

const monthlyBar = computed(() => {
  const months = store.byMonth
  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: 56, right: 16, top: 24, bottom: 48 },
    xAxis: { type: 'category', data: months.map((m) => m.month), axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, formatter: (v: number) => formatNumber(v) },
      splitNumber: 4,
    },
    color: ['#40916c', '#c17f4a'],
    series: [
      {
        name: 'Income',
        type: 'bar',
        barMaxWidth: 48,
        data: months.map((m) => m.income),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Expenses',
        type: 'bar',
        barMaxWidth: 48,
        data: months.map((m) => m.expense),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
})
</script>

<template>
  <div class="card p-5">
    <h3 class="text-sm font-semibold text-ink">Monthly income vs expenses</h3>
    <p class="mt-0.5 text-xs text-muted">{{ chartCaption }}</p>
    <div class="mt-4 w-full overflow-hidden" :style="{ height: `${CHART_HEIGHT}px` }">
      <VChart :option="monthlyBar" autoresize class="h-full w-full" />
    </div>
  </div>
</template>

<style scoped>
:deep(.echarts) {
  height: 100% !important;
  width: 100% !important;
  min-height: 0;
}
</style>
