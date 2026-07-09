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

const brandColors = ['#163d2f', '#2c4a6e', '#8b5a2b', '#3d5a4c', '#4a3f6b', '#c17f4a', '#5c4a42', '#40916c']

const categoryPie = computed(() => {
  const top = store.byCategory.slice(0, 8)
  return {
    tooltip: { trigger: 'item', formatter: '{b}: Br {c} ({d}%)' },
    color: brandColors,
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
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
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 48, right: 16, top: 24, bottom: 40 },
    xAxis: { type: 'category', data: months.map((m) => m.month) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatNumber(v) } },
    color: ['#163d2f', '#c17f4a'],
    series: [
      { name: 'Income', type: 'bar', data: months.map((m) => m.income), itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { name: 'Expense', type: 'bar', data: months.map((m) => m.expense), itemStyle: { borderRadius: [4, 4, 0, 0] } },
    ],
  }
})

const classificationBar = computed(() => {
  const items = store.byClassification.slice(0, 8)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 24, top: 8, bottom: 8 },
    xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatNumber(v) } },
    yAxis: { type: 'category', data: items.map((i) => i.name).reverse(), axisLabel: { fontSize: 10 } },
    color: ['#163d2f'],
    series: [{
      type: 'bar',
      data: items.map((i) => i.amount).reverse(),
      itemStyle: { borderRadius: [0, 4, 4, 0] },
    }],
  }
})
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-3">
    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">By category</h3>
      <VChart class="mt-2 h-56 w-full" :option="categoryPie" autoresize />
    </div>
    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">Monthly flow</h3>
      <VChart class="mt-2 h-56 w-full" :option="monthlyBar" autoresize />
    </div>
    <div class="card p-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">By classification</h3>
      <VChart class="mt-2 h-56 w-full" :option="classificationBar" autoresize />
    </div>
  </div>
</template>
