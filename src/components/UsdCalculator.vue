<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlansStore } from '@/stores/classification'
import { formatAmount } from '@/utils/format'
import { CalculatorIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const store = usePlansStore()
const open = ref(false)
const usdInput = ref('')
const brInput = ref('')

const usdValue = computed(() => parseFloat(usdInput.value) || 0)
const brValue = computed(() => parseFloat(brInput.value) || 0)
const usdToBr = computed(() => usdValue.value * store.usdRate)
const brToUsd = computed(() => (store.usdRate > 0 ? brValue.value / store.usdRate : 0))

function updateRate(value: number) {
  store.setUsdRate(value)
}
</script>

<template>
  <div class="no-print fixed bottom-5 right-5 z-50">
    <button
      v-if="!open"
      class="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800"
      @click="open = true"
    >
      <CalculatorIcon class="h-4 w-4" />
      Calculator
    </button>

    <div v-else class="w-72 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div class="flex items-center gap-2 text-white">
          <CalculatorIcon class="h-4 w-4 text-white/60" />
          <h3 class="text-sm font-medium">USD calculator</h3>
        </div>
        <button class="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white" @click="open = false">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-3 p-4">
        <label class="block">
          <span class="text-[11px] text-white/45">1 USD =</span>
          <div class="mt-1 flex items-center gap-2">
            <input
              :value="store.usdRate"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              @input="updateRate(parseFloat(($event.target as HTMLInputElement).value) || 0)"
            />
            <span class="shrink-0 text-xs text-white/50">Br</span>
          </div>
        </label>

        <label class="block">
          <span class="text-[11px] text-sky-400">USD → Br</span>
          <input
            v-model="usdInput"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-sky-500/50"
          />
          <p v-if="usdValue > 0" class="mt-1 text-xs text-white/50">
            = <span class="font-medium text-teal-400">{{ formatAmount(usdToBr, 'Br') }}</span>
          </p>
        </label>

        <label class="block">
          <span class="text-[11px] text-teal-400">Br → USD</span>
          <input
            v-model="brInput"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-teal-500/50"
          />
          <p v-if="brValue > 0" class="mt-1 text-xs text-white/50">
            = <span class="font-medium text-sky-400">{{ formatAmount(brToUsd, 'USD') }}</span>
          </p>
        </label>
      </div>
    </div>
  </div>
</template>
