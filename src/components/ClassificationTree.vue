<script setup lang="ts">
import { BRAND_CLASSIFICATION_COLORS } from '@/brand/tokens'
import ClassificationColumn from './ClassificationColumn.vue'
import CompanySummaryCard from './CompanySummaryCard.vue'
import { usePlansStore } from '@/stores/classification'

defineProps<{ editorVisible: boolean }>()

const store = usePlansStore()

function onDropCategory(toClassificationId: string, categoryId: string, fromClassificationId: string) {
  store.moveCategory(fromClassificationId, categoryId, toClassificationId)
}
</script>

<template>
  <main id="print-area" class="mx-auto max-w-7xl px-5 py-6 lg:px-8">
    <div class="print-only mb-8 text-center">
      <h1 class="font-display text-2xl font-bold text-ink">{{ store.data?.name || store.activePlan?.label }}</h1>
      <p class="mt-1 text-sm text-muted">{{ new Date().toLocaleDateString() }}</p>
    </div>

    <div class="flex flex-col items-center">
      <CompanySummaryCard
        v-if="store.data"
        :totals="store.totals"
        :company-name="store.data.name"
        :editor-visible="editorVisible"
        :exchange-rate="store.usdRate"
        @update:name="store.setCompanyName"
      />

      <template v-if="store.data?.classifications.length">
        <div class="tree-stem h-6" />
        <div
          class="tree-bar"
          :style="{ width: `${Math.min(store.data.classifications.length * 224, 1150)}px` }"
        />
      </template>
    </div>

    <div
      v-if="store.data?.classifications.length"
      class="mt-0 flex flex-wrap justify-center gap-x-5 gap-y-12"
    >
      <ClassificationColumn
        v-for="classification in store.data.classifications"
        :key="classification.id"
        :classification="classification"
        :editor-visible="editorVisible"
        @update="store.updateClassification(classification.id, $event)"
        @remove="store.removeClassification(classification.id)"
        @add-category="store.addCategory(classification.id)"
        @add-category-usd="store.addCategory(classification.id, 'New category', undefined, 'USD')"
        @update-category="(id, patch) => store.updateCategory(classification.id, id, patch)"
        @remove-category="(id) => store.removeCategory(classification.id, id)"
        @drop-category="(catId, fromId) => onDropCategory(classification.id, catId, fromId)"
      />
    </div>

    <div v-else class="mt-28 text-center">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-brand-fg shadow-lg shadow-brand/20">
        F
      </div>
      <h2 class="mt-5 font-display text-xl font-semibold text-ink">Build your expense tree</h2>
      <p class="mt-2 text-sm text-muted">Add classifications, line items, and print a clean summary.</p>
      <button
        v-if="editorVisible"
        class="btn-primary mt-8 !px-8 !py-3 !text-sm"
        @click="store.addClassification('New classification', BRAND_CLASSIFICATION_COLORS[0])"
      >
        Add first classification
      </button>
    </div>

    <div v-if="editorVisible && store.data?.classifications.length" class="no-print mt-16 flex justify-center">
      <button
        class="rounded-xl border border-dashed border-line bg-elevated/70 px-8 py-3 text-sm font-semibold text-muted shadow-sm transition hover:border-brand/40 hover:bg-elevated hover:text-brand"
        @click="store.addClassification('New classification', BRAND_CLASSIFICATION_COLORS[store.data.classifications.length % BRAND_CLASSIFICATION_COLORS.length])"
      >
        + Add classification
      </button>
    </div>
  </main>
</template>
