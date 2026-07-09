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
  CheckIcon,
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
  <div ref="rootRef" class="no-print flex min-w-0 flex-wrap items-center justify-end gap-2">
    <span
      v-if="store.isCloud"
      class="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/15 sm:px-2.5"
      :title="store.syncError ?? 'Synced to cloud'"
    >
      <CloudIcon class="h-3 w-3 shrink-0" :class="store.syncing ? 'animate-pulse' : ''" />
      <span class="hidden sm:inline">{{ store.syncing ? 'Syncing' : store.syncError ? 'Error' : 'Saved' }}</span>
    </span>

    <div class="relative min-w-0">
      <button
        class="flex max-w-full items-center gap-2 rounded-[10px] bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        @click="open = !open"
      >
        <span class="max-w-[8rem] truncate sm:max-w-[12rem]">{{ displayLabel }}</span>
        <ChevronDownIcon class="h-3.5 w-3.5 shrink-0 text-white/60" />
      </button>

      <div
        v-if="open"
        class="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,16rem)] overflow-hidden rounded-2xl border border-line bg-elevated py-1 shadow-xl"
      >
        <p class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted">Your plans</p>
        <button
          v-for="plan in store.state.plans"
          :key="plan.id"
          class="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-surface"
          :class="plan.id === store.activePlan?.id ? 'bg-accent-soft/50' : ''"
          @click="selectPlan(plan.id)"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-ink">{{ plan.data.name.trim() || plan.label }}</p>
            <p class="text-[10px] text-muted">{{ formatDate(plan.updatedAt) }}</p>
          </div>
          <button
            v-if="store.state.plans.length > 1"
            class="ml-2 shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
            @click="deletePlan(plan.id, $event)"
          >
            <TrashIcon class="h-3.5 w-3.5" />
          </button>
        </button>

        <div class="border-t border-line p-1">
          <button
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            @click="newPlan"
          >
            <PlusIcon class="h-4 w-4 text-brand" />
            New plan
          </button>
          <button
            v-if="auth.isAuthenticated"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface"
            @click="signOut"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>

    <button
      class="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-semibold transition ring-1"
      :class="savedFlash
        ? 'bg-emerald-500/20 text-emerald-100 ring-emerald-400/30'
        : 'bg-white/10 text-white ring-white/15 hover:bg-white/15'"
      @click="save"
    >
      <CheckIcon v-if="savedFlash" class="h-3.5 w-3.5" />
      {{ savedFlash ? 'Saved' : 'Save' }}
    </button>

    <slot />
  </div>
</template>
