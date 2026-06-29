<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { Classification } from '@/types'
import { formatNumber, totalsForCategories } from '@/utils/format'
import { hexToRgba } from '@/utils/color'
import CategoryCard from './CategoryCard.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

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

const editingName = ref(false)
const showAddMenu = ref(false)
const addMenuRef = ref<HTMLElement>()
const columnTotals = computed(() => totalsForCategories(props.classification.categories))
const tintBg = computed(() => hexToRgba(props.classification.color, 0.12))

onClickOutside(addMenuRef, () => { showAddMenu.value = false })

function onDrop(e: DragEvent) {
  const raw = e.dataTransfer?.getData('application/json')
  if (!raw) return
  const { categoryId, classificationId } = JSON.parse(raw)
  emit('dropCategory', categoryId, classificationId)
}
</script>

<template>
  <div class="flex w-[208px] flex-col items-stretch">
    <!-- Classification header -->
    <div
      class="group relative overflow-hidden rounded-2xl px-4 py-4 shadow-md ring-1 ring-black/[0.06]"
      :style="{
        backgroundColor: tintBg,
        boxShadow: `0 8px 28px -8px ${hexToRgba(classification.color, 0.35)}`,
      }"
    >
      <div class="absolute inset-x-0 top-0 h-1.5" :style="{ backgroundColor: classification.color }" />

      <button
        v-if="editorVisible"
        class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-elevated/90 text-xs text-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
        @click="emit('remove')"
      >
        ×
      </button>

      <div class="flex items-center gap-2.5">
        <input
          v-if="editorVisible"
          type="color"
          :value="classification.color"
          class="h-4 w-4 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-sm"
          @input="emit('update', { color: ($event.target as HTMLInputElement).value })"
        />
        <span
          v-else
          class="h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-white"
          :style="{ backgroundColor: classification.color }"
        />

        <input
          v-if="editorVisible && editingName"
          :value="classification.name"
          class="min-w-0 flex-1 bg-transparent font-display text-sm font-semibold text-ink outline-none"
          autofocus
          @blur="editingName = false"
          @keydown.enter="editingName = false"
          @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
        />
        <button
          v-else
          type="button"
          class="min-w-0 flex-1 text-left font-display text-sm font-semibold text-ink"
          :class="editorVisible ? 'cursor-text hover:text-brand' : ''"
          @click="editorVisible && (editingName = true)"
        >
          {{ classification.name }}
        </button>
      </div>

      <div class="mt-3 space-y-0.5">
        <p class="font-mono-nums text-sm font-bold text-ink">
          Br {{ formatNumber(columnTotals.Br) }}
        </p>
        <p
          v-if="columnTotals.USD > 0 || editorVisible"
          class="font-mono-nums text-xs font-medium text-muted"
        >
          USD {{ formatNumber(columnTotals.USD) }}
        </p>
      </div>
    </div>

    <div class="tree-drop mx-auto" />

    <!-- Line items -->
    <div class="flex flex-col gap-2" @dragover.prevent @drop="onDrop">
      <CategoryCard
        v-for="cat in classification.categories"
        :key="cat.id"
        :category="cat"
        :classification-id="classification.id"
        :classification-color="classification.color"
        :editor-visible="editorVisible"
        @update="emit('updateCategory', cat.id, $event)"
        @remove="emit('removeCategory', cat.id)"
      />

      <div v-if="editorVisible" ref="addMenuRef" class="relative">
        <button
          class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2.5 text-xs font-semibold text-muted transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          @click="showAddMenu = !showAddMenu"
        >
          <PlusIcon class="h-3.5 w-3.5" />
          Add item
        </button>
        <div
          v-if="showAddMenu"
          class="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-elevated py-1 shadow-lg"
        >
          <button
            class="w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-surface"
            @click="emit('addCategory'); showAddMenu = false"
          >
            Birr line item
          </button>
          <button
            class="w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-surface"
            @click="emit('addCategoryUsd'); showAddMenu = false"
          >
            USD line item
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
