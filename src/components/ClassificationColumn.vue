<script setup lang="ts">
import { computed } from 'vue'
import type { Classification } from '@/types'
import { totalsForCategories } from '@/utils/format'
import CategoryCard from './CategoryCard.vue'

const props = defineProps<{
  classification: Classification
  editorVisible: boolean
}>()

const emit = defineEmits<{
  update: [patch: Partial<Pick<Classification, 'name' | 'color'>>]
  remove: []
  addCategory: []
  addCategoryUsd: []
  updateCategory: [categoryId: string, patch: Partial<{ name: string; color: string; amount: number; currency: 'Br' | 'USD' }>]
  removeCategory: [categoryId: string]
  dropCategory: [categoryId: string, fromClassificationId: string]
}>()

const columnTotals = computed(() => totalsForCategories(props.classification.categories))

function onDrop(e: DragEvent) {
  const raw = e.dataTransfer?.getData('application/json')
  if (!raw) return
  const { categoryId, classificationId } = JSON.parse(raw)
  emit('dropCategory', categoryId, classificationId)
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="group relative w-full max-w-[152px] overflow-hidden rounded-xl bg-white shadow-md shadow-slate-200/60 ring-1 ring-slate-200/80">
      <div class="h-1" :style="{ backgroundColor: classification.color }" />

      <div class="px-3 py-3">
        <div class="flex items-center gap-1.5">
          <input
            v-if="editorVisible"
            type="color"
            :value="classification.color"
            class="h-3 w-3 shrink-0 cursor-pointer rounded-full border-0 p-0"
            @input="emit('update', { color: ($event.target as HTMLInputElement).value })"
          />
          <span v-else class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: classification.color }" />

          <input
            v-if="editorVisible"
            :value="classification.name"
            class="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none"
            @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
          />
          <span v-else class="text-xs font-medium text-slate-800">{{ classification.name }}</span>
        </div>

        <div class="mt-2 space-y-0.5 text-[11px] tabular-nums text-slate-500">
          <p><span class="text-teal-600">Br</span> {{ columnTotals.Br.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
          <p v-if="columnTotals.USD > 0 || editorVisible">
            <span class="text-sky-600">USD</span> {{ columnTotals.USD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </p>
        </div>
      </div>

      <button
        v-if="editorVisible"
        class="absolute right-1.5 top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 group-hover:flex hover:bg-red-500 hover:text-white"
        @click="emit('remove')"
      >
        ×
      </button>
    </div>

    <div class="my-2.5 h-5 w-px bg-slate-300/80" />

    <div
      class="flex w-full max-w-[152px] flex-col gap-2"
      @dragover.prevent
      @drop="onDrop"
    >
      <CategoryCard
        v-for="cat in classification.categories"
        :key="cat.id"
        :category="cat"
        :classification-id="classification.id"
        :editor-visible="editorVisible"
        @update="emit('updateCategory', cat.id, $event)"
        @remove="emit('removeCategory', cat.id)"
      />

      <template v-if="editorVisible">
        <button
          class="rounded-lg py-2 text-[11px] font-medium text-slate-400 ring-1 ring-dashed ring-slate-300 transition hover:text-teal-600 hover:ring-teal-400"
          @click="emit('addCategory')"
        >
          + Br category
        </button>
        <button
          class="rounded-lg py-2 text-[11px] font-medium text-slate-400 ring-1 ring-dashed ring-slate-300 transition hover:text-sky-600 hover:ring-sky-400"
          @click="emit('addCategoryUsd')"
        >
          + USD category
        </button>
      </template>
    </div>
  </div>
</template>
