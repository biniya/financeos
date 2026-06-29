<script setup lang="ts">
import { ref } from 'vue'
import { usePlansStore } from '@/stores/classification'
import { printPlan } from '@/utils/print'
import ClassificationColumn from './ClassificationColumn.vue'
import PlanSwitcher from './PlanSwitcher.vue'
import CompanySummaryCard from './CompanySummaryCard.vue'
import UsdCalculator from './UsdCalculator.vue'
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline'

const store = usePlansStore()
const editorVisible = ref(true)

const presetColors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b', '#64748b']

function onDropCategory(toClassificationId: string, categoryId: string, fromClassificationId: string) {
  store.moveCategory(fromClassificationId, categoryId, toClassificationId)
}

async function handlePrint() {
  await printPlan(editorVisible)
}
</script>

<template>
  <div class="min-h-screen bg-[#f4f5f7]">
    <div class="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 px-6 py-3 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            F
          </div>
          <p class="hidden text-xs text-slate-500 sm:block">
            Drag to reorganize · {{ store.isCloud ? 'cloud sync' : 'local save' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <PlanSwitcher>
            <button
              class="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
              @click="handlePrint"
            >
              <DocumentArrowDownIcon class="h-3.5 w-3.5" />
              Print
            </button>
          </PlanSwitcher>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            @click="editorVisible = !editorVisible"
          >
            {{ editorVisible ? 'Preview' : 'Edit' }}
          </button>
        </div>
      </div>
    </div>

    <div id="print-area" class="mx-auto max-w-6xl px-6 py-8">
      <div class="print-only mb-8 text-center">
        <h1 class="text-xl font-bold">{{ store.data?.name || store.activePlan?.label }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ new Date().toLocaleDateString() }}</p>
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

        <div v-if="store.data?.classifications.length" class="my-5 h-10 w-px bg-gradient-to-b from-slate-300 to-transparent" />
        <div
          v-if="store.data?.classifications.length"
          class="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"
          :style="{ width: `${Math.min((store.data?.classifications.length ?? 0) * 160, 960)}px` }"
        />
      </div>

      <div
        v-if="store.data?.classifications.length"
        class="mt-0 flex flex-wrap justify-center gap-x-5 gap-y-8"
      >
        <div
          v-for="classification in store.data.classifications"
          :key="classification.id"
          class="flex flex-col items-center"
        >
          <div class="h-5 w-px bg-slate-300/80" />
          <ClassificationColumn
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
      </div>

      <div v-else class="mt-20 text-center">
        <p class="text-sm text-slate-400">No classifications yet</p>
        <button
          v-if="editorVisible"
          class="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          @click="store.addClassification('New classification', presetColors[0])"
        >
          Add first classification
        </button>
      </div>

      <div v-if="editorVisible && store.data?.classifications.length" class="no-print mt-12 flex justify-center">
        <button
          class="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-500 ring-1 ring-dashed ring-slate-300 transition hover:text-slate-800 hover:ring-slate-400"
          @click="store.addClassification('New classification', presetColors[store.data.classifications.length % presetColors.length])"
        >
          + Add classification
        </button>
      </div>
    </div>

    <UsdCalculator />
  </div>
</template>
