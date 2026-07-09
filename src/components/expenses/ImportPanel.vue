<script setup lang="ts">
import { ref } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { parseTransactionsCsv } from '@/utils/csvImport'
import type { Transaction } from '@/types/transactions'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{ imported: [result: { imported: number; skipped: number; errors: string[] }] }>()

const store = useTransactionsStore()
const dragging = ref(false)
const preview = ref<Transaction[]>([])
const previewErrors = ref<string[]>([])
const previewTotal = ref(0)
const importing = ref(false)
const stripCategories = ref(true)
const fileInput = ref<HTMLInputElement>()

function processFile(text: string) {
  const result = parseTransactionsCsv(text, { stripCategories: stripCategories.value })
  preview.value = result.transactions.slice(0, 5)
  previewErrors.value = result.errors
  previewTotal.value = result.transactions.length
  return text
}

let pendingCsv = ''

async function handleText(text: string) {
  pendingCsv = text
  processFile(text)
}

async function confirmImport() {
  if (!pendingCsv) return
  importing.value = true
  try {
    const result = await store.importCsv(pendingCsv, { stripCategories: stripCategories.value })
    emit('imported', result)
    preview.value = []
    pendingCsv = ''
    previewErrors.value = []
  } finally {
    importing.value = false
  }
}

function onFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => handleText(String(reader.result ?? ''))
  reader.readAsText(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file?.name.endsWith('.csv')) onFile(file)
}

function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) onFile(file)
}

function reprocessPreview() {
  if (pendingCsv) processFile(pendingCsv)
}
</script>

<template>
  <div
    class="card border-2 border-dashed p-6 transition"
    :class="dragging ? 'border-brand bg-brand/5' : 'border-line'"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <div class="text-center">
      <ArrowUpTrayIcon class="mx-auto h-8 w-8 text-muted" />
      <p class="mt-2 text-sm font-semibold text-ink">Import bank CSV</p>
      <p class="mt-1 text-xs text-muted">
        We pull in date, amount, and description — you assign categories yourself.
      </p>
      <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="onPick" />
      <button type="button" class="btn-primary mt-4" @click="fileInput?.click()">
        Choose file
      </button>
    </div>

    <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface px-4 py-3 text-left">
      <input
        v-model="stripCategories"
        type="checkbox"
        class="mt-0.5 rounded border-line text-brand focus:ring-brand"
        @change="reprocessPreview"
      />
      <span class="text-xs">
        <span class="font-semibold text-ink">I'll categorize myself</span>
        <span class="mt-0.5 block text-muted">
          Ignore bank categories on import. Original labels are kept as hints while you work through the inbox.
        </span>
      </span>
    </label>

    <div v-if="preview.length" class="mt-6 border-t border-line pt-4">
      <p class="text-xs font-bold uppercase tracking-wider text-muted">Preview (first 5 rows)</p>
      <ul class="mt-2 space-y-1 text-xs text-ink">
        <li v-for="t in preview" :key="t.id" class="rounded-lg bg-surface px-3 py-2">
          {{ t.date }} · {{ t.type }} · Br {{ t.amount }} — {{ t.description || '—' }}
          <span v-if="t.importHint" class="text-muted"> (was: {{ t.importHint }})</span>
        </li>
      </ul>
      <ul v-if="previewErrors.length" class="mt-2 text-xs text-red-600">
        <li v-for="(err, i) in previewErrors.slice(0, 5)" :key="i">{{ err }}</li>
      </ul>
      <button
        type="button"
        class="btn-primary mt-4 w-full"
        :disabled="importing"
        @click="confirmImport"
      >
        {{ importing ? 'Importing…' : `Import ${previewTotal} rows` }}
      </button>
    </div>
  </div>
</template>
