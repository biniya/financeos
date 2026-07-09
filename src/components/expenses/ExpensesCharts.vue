<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useTransactionsStore } from '@/stores/transactions'
import { formatNumber } from '@/utils/format'

use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const store = useTransactionsStore()

const CHART_HEIGHT = 200

const brandColors = ['#163d2f', '#2c4a6e', '#8b5a2b', '#3d5a4c', '#4a3f6b', '#c17f4a', '#5c4a42', '#40916c']

const categoryPie = computed(() => {
  const top = store.byCategory.slice(0, 8)
  return {
    tooltip: { trigger: 'item', formatter: '{b}: Br {c} ({d}%)' },
    color: brandColors,
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '46%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { fontSize: 10 },
      data: top.map((c) => ({ name: c.name, value: Math.round(c.amount) })),
    }],
  }
})

const monthlyBar = computed(() => {
  const months = store.byMonth
  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 44, right: 12, top: 16, bottom: 36, containLabel: false },
    xAxis: { type: 'category', data: months.map((m) => m.month), axisLabel: { fontSize: 10 } },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, formatter: (v: number) => formatNumber(v) },
      splitNumber: 4,
    },
    color: ['#163d2f', '#c17f4a'],
    series: [
      {
        name: 'Income',
        type: 'bar',
        barMaxWidth: 36,
        data: months.map((m) => m.income),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Expense',
        type: 'bar',
        barMaxWidth: 36,
        data: months.map((m) => m.expense),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
})

const classificationBar = computed(() => {
  const items = store.byClassification.slice(0, 6)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 4, right: 16, top: 4, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, formatter: (v: number) => formatNumber(v) },
      splitNumber: 3,
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.name).reverse(),
      axisLabel: { fontSize: 10, width: 88, overflow: 'truncate' },
    },
    color: ['#163d2f'],
    series: [{
      type: 'bar',
      barMaxWidth: 20,
      data: items.map((i) => i.amount).reverse(),
      itemStyle: { borderRadius: [0, 4, 4, 0] },
    }],
  }
})

const classificationHeight = computed(() => {
  const count = Math.min(store.byClassification.length, 6)
  return Math.min(CHART_HEIGHT, Math.max(120, count * 28 + 48))
})

const chartCaption = computed(() =>
  store.overviewExpenseMode === 'recurring'
    ? 'Charts exclude one-time expenses'
    : 'Charts include all expenses',
)
</script>

<template>
  <div class="space-y-2">
    <p class="text-xs text-muted">{{ chartCaption }}</p>
    <div class="grid gap-4 lg:grid-cols-3">
    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">By category</h3>
      <div class="mt-2 w-full overflow-hidden" :style="{ height: `${CHART_HEIGHT}px` }">
        <VChart :option="categoryPie" autoresize class="h-full w-full" />
      </div>
    </div>

    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">Monthly flow</h3>
      <div class="mt-2 w-full overflow-hidden" :style="{ height: `${CHART_HEIGHT}px` }">
        <VChart :option="monthlyBar" autoresize class="h-full w-full" />
      </div>
    </div>

    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">By classification</h3>
      <div class="mt-2 w-full overflow-hidden" :style="{ height: `${classificationHeight}px` }">
        <VChart :option="classificationBar" autoresize class="h-full w-full" />
      </div>
    </div>
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
