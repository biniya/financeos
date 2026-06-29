<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Category } from '@/types'
import { formatAmount } from '@/utils/format'
import { hexToRgba } from '@/utils/color'
import FormattedAmountInput from './FormattedAmountInput.vue'

const props = defineProps<{
  category: Category
  classificationId: string
  classificationColor: string
  editorVisible: boolean
}>()

const emit = defineEmits<{
  update: [patch: Partial<Pick<Category, 'name' | 'color' | 'amount' | 'currency'>>]
  remove: []
  dragStart: [categoryId: string, classificationId: string]
}>()

const dragOver = ref(false)
const editingName = ref(false)
const editingAmount = ref(false)
const itemCurrency = computed(() => props.category.currency ?? 'Br')
const isUsd = computed(() => itemCurrency.value === 'USD')

function onDragStart(e: DragEvent) {
  if (editingName.value || editingAmount.value) {
    e.preventDefault()
    return
  }
  e.dataTransfer?.setData('application/json', JSON.stringify({
    categoryId: props.category.id,
    classificationId: props.classificationId,
  }))
  e.dataTransfer!.effectAllowed = 'move'
  emit('dragStart', props.category.id, props.classificationId)
}

function toggleCurrency() {
  if (!props.editorVisible) return
  emit('update', { currency: isUsd.value ? 'Br' : 'USD' })
}
</script>

<template>
  <div
    class="group relative rounded-xl bg-elevated px-3.5 py-3 shadow-sm ring-1 transition-all duration-200"
    :class="[
      dragOver ? 'ring-2 ring-brand/30 shadow-md -translate-y-px' : 'ring-black/[0.05]',
      editorVisible && !editingName && !editingAmount ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : '',
    ]"
    :style="{ borderLeft: `3px solid ${hexToRgba(classificationColor, 0.7)}` }"
    :draggable="editorVisible && !editingName && !editingAmount"
    @dragstart="onDragStart"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="dragOver = false"
  >
    <button
      v-if="editorVisible"
      class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[11px] text-muted opacity-0 shadow ring-1 ring-black/10 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
      @click.stop="emit('remove')"
    >
      ×
    </button>

    <div class="flex items-start justify-between gap-2">
      <input
        v-if="editorVisible && editingName"
        :value="category.name"
        class="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none"
        autofocus
        @blur="editingName = false"
        @keydown.enter="editingName = false"
        @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
      />
      <button
        v-else
        type="button"
        class="min-w-0 flex-1 text-left text-[13px] font-medium text-ink"
        :class="editorVisible ? 'cursor-text hover:text-brand' : ''"
        @click="editorVisible && (editingName = true)"
      >
        {{ category.name }}
      </button>

      <button
        v-if="editorVisible"
        type="button"
        class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition"
        :class="isUsd ? 'bg-accent-soft text-usd' : 'bg-brand/10 text-brand'"
        @click.stop="toggleCurrency"
      >
        {{ itemCurrency }}
      </button>
      <span
        v-else
        class="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted"
      >
        {{ itemCurrency }}
      </span>
    </div>

    <div class="mt-2">
      <FormattedAmountInput
        v-if="editorVisible && editingAmount"
        :model-value="category.amount"
        :currency="itemCurrency"
        @update:model-value="emit('update', { amount: $event })"
        @blur="editingAmount = false"
      />
      <button
        v-else
        type="button"
        class="font-mono-nums text-left text-base font-semibold"
        :class="[isUsd ? 'text-usd' : 'text-birr', editorVisible ? 'cursor-text hover:opacity-70' : '']"
        @click="editorVisible && (editingAmount = true)"
      >
        {{ formatAmount(category.amount, itemCurrency) }}
      </button>
    </div>
  </div>
</template>
