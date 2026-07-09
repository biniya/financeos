<script setup lang="ts">
import { planEditorVisible } from '@/composables/usePlanEditor'
import PlanSwitcher from '@/components/PlanSwitcher.vue'
import { printPlan } from '@/utils/print'
import { DocumentArrowDownIcon, PencilSquareIcon, EyeIcon } from '@heroicons/vue/24/outline'

async function handlePrint() {
  await printPlan(planEditorVisible)
}
</script>

<template>
  <PlanSwitcher>
    <button class="btn-accent !py-2" @click="handlePrint">
      <DocumentArrowDownIcon class="h-4 w-4" />
      Print
    </button>
  </PlanSwitcher>

  <div class="segmented !bg-white/10 !ring-white/15">
    <button
      class="segmented-btn"
      :class="planEditorVisible ? 'segmented-btn-active !bg-white !text-brand' : '!text-white/70 hover:!text-white'"
      @click="planEditorVisible = true"
    >
      <PencilSquareIcon class="h-3.5 w-3.5" />
      Edit
    </button>
    <button
      class="segmented-btn"
      :class="!planEditorVisible ? 'segmented-btn-active !bg-white !text-brand' : '!text-white/70 hover:!text-white'"
      @click="planEditorVisible = false"
    >
      <EyeIcon class="h-3.5 w-3.5" />
      Preview
    </button>
  </div>
</template>
