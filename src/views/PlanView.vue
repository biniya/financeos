<script setup lang="ts">
import { planEditorVisible } from '@/composables/usePlanEditor'
import ClassificationTree from '@/components/ClassificationTree.vue'
import UsdCalculator from '@/components/UsdCalculator.vue'
</script>

<template>
  <ClassificationTree :editor-visible="planEditorVisible" />
  <UsdCalculator />
</template>
