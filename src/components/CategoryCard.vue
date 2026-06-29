<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Category } from '@/types'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  category: Category
  classificationId: string
  editorVisible: boolean
}>()

const emit = defineEmits<{
  update: [patch: Partial<Pick<Category, 'name' | 'color' | 'amount' | 'currency'>>]
  remove: []
  dragStart: [categoryId: string, classificationId: string]
}>()

const dragOver = ref(false)
const itemCurrency = computed(() => props.category.currency ?? 'Br')
const isUsd = computed(() => itemCurrency.value === 'USD')

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('application/json', JSON.stringify({
    categoryId: props.category.id,
    classificationId: props.classificationId,
  }))
  e.dataTransfer!.effectAllowed = 'move'
  emit('dragStart', props.category.id, props.classificationId)
}

function onAmountInput(e: Event) {
  emit('update', { amount: parseFloat((e.target as HTMLInputElement).value) || 0 })
}

function setCurrency(currency: 'Br' | 'USD') {
  emit('update', { currency })
}
</script>

<template>
  <div
    class="group relative rounded-xl bg-white py-2.5 pl-3 pr-2.5 shadow-sm ring-1 transition"
    :class="[
      isUsd ? 'ring-sky-200/80' : 'ring-slate-200/80',
      dragOver ? 'ring-2 ring-indigo-400' : '',
      editorVisible ? 'cursor-grab active:cursor-grabbing' : '',
    ]"
    :style="{ borderLeft: `3px solid ${isUsd ? '#38bdf8' : '#2dd4bf'}` }"
    :draggable="editorVisible"
    @dragstart="onDragStart"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="dragOver = false"
  >
    <div class="flex items-start justify-between gap-1">
      <input
        v-if="editorVisible"
        :value="category.name"
        class="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none"
        @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
      />
      <span v-else class="text-xs font-medium text-slate-800">{{ category.name }}</span>

      <button
        v-if="editorVisible"
        class="hidden h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] text-slate-400 group-hover:flex hover:bg-red-50 hover:text-red-500"
        @click.stop="emit('remove')"
      >
        ×
      </button>
    </div>

    <div v-if="editorVisible" class="mt-2 flex gap-1">
      <button
        type="button"
        class="rounded px-1.5 py-0.5 text-[9px] font-semibold transition"
        :class="!isUsd ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'"
        @click="setCurrency('Br')"
      >
        Br
      </button>
      <button
        type="button"
        class="rounded px-1.5 py-0.5 text-[9px] font-semibold transition"
        :class="isUsd ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'"
        @click="setCurrency('USD')"
      >
        USD
      </button>
    </div>

    <div class="mt-1.5">
      <input
        v-if="editorVisible"
        type="number"
        :value="category.amount"
        min="0"
        step="0.01"
        class="w-full bg-transparent text-sm font-semibold tabular-nums outline-none"
        :class="isUsd ? 'text-sky-600' : 'text-teal-700'"
        @input="onAmountInput"
      />
      <p v-else class="text-sm font-semibold tabular-nums" :class="isUsd ? 'text-sky-600' : 'text-teal-700'">
        {{ formatAmount(category.amount, itemCurrency) }}
      </p>
    </div>
  </div>
</template>
