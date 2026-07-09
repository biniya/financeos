<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import PlanToolbar from '@/components/layout/PlanToolbar.vue'
import { usePlansStore } from '@/stores/classification'
import { useTransactionsStore } from '@/stores/transactions'
import { CloudIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const plans = usePlansStore()
const transactions = useTransactionsStore()

const isPlan = computed(() => route.name === 'plan')
const isExpenses = computed(() => route.name === 'expenses')
const cloudLabel = computed(() => {
  if (plans.isCloud || transactions.isCloud) return 'Cloud'
  return 'Local'
})
</script>

<template>
  <div class="min-h-screen">
    <header class="no-print sticky top-0 z-40 bg-brand shadow-md shadow-brand/20">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
        <div class="flex items-center gap-4">
          <BrandLogo size="sm" variant="light">
            <div class="hidden min-w-0 sm:block">
              <p class="font-display text-sm font-semibold leading-none text-white">FinanceOS</p>
              <p class="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">
                <CloudIcon v-if="plans.isCloud || transactions.isCloud" class="h-3 w-3" />
                {{ cloudLabel }}
              </p>
            </div>
          </BrandLogo>

          <nav class="flex rounded-[10px] bg-white/10 p-1 ring-1 ring-white/15">
            <RouterLink
              to="/plan"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              :class="isPlan ? 'bg-white text-brand' : 'text-white/70 hover:text-white'"
            >
              Plan
            </RouterLink>
            <RouterLink
              to="/expenses"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              :class="isExpenses ? 'bg-white text-brand' : 'text-white/70 hover:text-white'"
            >
              Expenses
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <PlanToolbar v-if="isPlan" />
          <slot name="actions" />
        </div>
      </div>
    </header>

    <RouterView />
  </div>
</template>
