<script setup lang="ts">
import { ref } from 'vue'
import { usePlansStore } from '@/stores/classification'
import { printPlan } from '@/utils/print'
import { BRAND_CLASSIFICATION_COLORS } from '@/brand/tokens'
import BrandLogo from './brand/BrandLogo.vue'
import ClassificationColumn from './ClassificationColumn.vue'
import PlanSwitcher from './PlanSwitcher.vue'
import CompanySummaryCard from './CompanySummaryCard.vue'
import UsdCalculator from './UsdCalculator.vue'
import {
  DocumentArrowDownIcon,
  PencilSquareIcon,
  EyeIcon,
  CloudIcon,
} from '@heroicons/vue/24/outline'

const store = usePlansStore()
const editorVisible = ref(true)

function onDropCategory(toClassificationId: string, categoryId: string, fromClassificationId: string) {
  store.moveCategory(fromClassificationId, categoryId, toClassificationId)
}

async function handlePrint() {
  await printPlan(editorVisible)
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Brand header bar -->
    <header class="no-print sticky top-0 z-40 bg-brand shadow-md shadow-brand/20">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <BrandLogo size="sm" variant="light">
          <div class="hidden min-w-0 sm:block">
            <p class="font-display text-sm font-semibold leading-none text-white">FinanceOS</p>
            <p class="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">
              <CloudIcon v-if="store.isCloud" class="h-3 w-3" />
              {{ store.isCloud ? 'Cloud' : 'Local' }}
              <span class="text-white/25">·</span>
              Plan · Track · Print
            </p>
          </div>
        </BrandLogo>

        <div class="flex items-center gap-2">
          <PlanSwitcher>
            <button class="btn-accent !py-2" @click="handlePrint">
              <DocumentArrowDownIcon class="h-4 w-4" />
              Print
            </button>
          </PlanSwitcher>

          <div class="segmented !bg-white/10 !ring-white/15">
            <button
              class="segmented-btn"
              :class="editorVisible ? 'segmented-btn-active !bg-white !text-brand' : '!text-white/70 hover:!text-white'"
              @click="editorVisible = true"
            >
              <PencilSquareIcon class="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              class="segmented-btn"
              :class="!editorVisible ? 'segmented-btn-active !bg-white !text-brand' : '!text-white/70 hover:!text-white'"
              @click="editorVisible = false"
            >
              <EyeIcon class="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </header>

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

      <!-- Empty state -->
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

    <UsdCalculator />
  </div>
</template>
