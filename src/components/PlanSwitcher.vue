<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/classification'
import { formatDate } from '@/utils/format'
import {
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  CloudIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const store = usePlansStore()
const open = ref(false)
const savedFlash = ref(false)
const rootRef = ref<HTMLElement>()

onClickOutside(rootRef, () => { open.value = false })

const displayLabel = computed(() => {
  const plan = store.activePlan
  return plan?.data.name.trim() || plan?.label || 'Plan'
})

async function selectPlan(id: string) {
  await store.switchPlan(id)
  open.value = false
}

async function newPlan() {
  await store.createPlan()
  open.value = false
}

async function save() {
  await store.savePlan()
  savedFlash.value = true
  setTimeout(() => (savedFlash.value = false), 2000)
}

async function deletePlan(id: string, e: Event) {
  e.stopPropagation()
  const plan = store.state.plans.find((p) => p.id === id)
  if (!plan) return
  const name = plan.data.name.trim() || plan.label
  if (confirm(`Delete plan "${name}"? This cannot be undone.`)) {
    await store.deletePlan(id)
    if (!store.state.plans.find((p) => p.id === id)) open.value = false
  }
}

async function signOut() {
  await auth.signOut()
}
</script>

<template>
  <div ref="rootRef" class="no-print flex items-center gap-2">
    <span
      v-if="store.isCloud"
      class="hidden items-center gap-1 text-[10px] text-slate-400 sm:flex"
      :title="store.syncError ?? 'Synced to cloud'"
    >
      <CloudIcon class="h-3.5 w-3.5" :class="store.syncing ? 'animate-pulse text-sky-500' : ''" />
      {{ store.syncing ? 'Syncing…' : store.syncError ? 'Sync error' : 'Cloud' }}
    </span>

    <div class="relative">
      <button
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        @click="open = !open"
      >
        <span class="max-w-[120px] truncate">{{ displayLabel }}</span>
        <ChevronDownIcon class="h-3.5 w-3.5 text-slate-400" />
      </button>

      <div
        v-if="open"
        class="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
      >
        <p class="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">Saved plans</p>
        <button
          v-for="plan in store.state.plans"
          :key="plan.id"
          class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-slate-50"
          :class="plan.id === store.activePlan?.id ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
          @click="selectPlan(plan.id)"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ plan.data.name.trim() || plan.label }}</p>
            <p class="text-[10px] text-slate-400">Updated {{ formatDate(plan.updatedAt) }}</p>
          </div>
          <button
            v-if="store.state.plans.length > 1"
            class="ml-2 shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            title="Delete plan"
            @click="deletePlan(plan.id, $event)"
          >
            <TrashIcon class="h-3.5 w-3.5" />
          </button>
        </button>

        <div class="border-t border-slate-100 p-1">
          <button
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            @click="newPlan"
          >
            <PlusIcon class="h-4 w-4" />
            New plan
          </button>
          <button
            v-if="auth.isAuthenticated"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
            @click="signOut"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>

    <button
      class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition"
      :class="savedFlash ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'"
      @click="save"
    >
      {{ savedFlash ? 'Saved ✓' : 'Save' }}
    </button>

    <slot />
  </div>
</template>
