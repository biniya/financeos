<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlansStore } from '@/stores/classification'
import { formatAmount } from '@/utils/format'
import { CalculatorIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const store = usePlansStore()
const open = ref(false)
const usdInput = ref('')
const brInput = ref('')

const usdValue = computed(() => parseFloat(usdInput.value.replace(/,/g, '')) || 0)
const brValue = computed(() => parseFloat(brInput.value.replace(/,/g, '')) || 0)
const usdToBr = computed(() => usdValue.value * store.usdRate)
const brToUsd = computed(() => (store.usdRate > 0 ? brValue.value / store.usdRate : 0))

function updateRate(value: number) {
  store.setUsdRate(value)
}
</script>

<template>
  <div class="no-print fixed bottom-6 right-6 z-50">
    <button
      v-if="!open"
      class="flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-brand-fg shadow-xl shadow-brand/30 transition hover:bg-brand-hover"
      @click="open = true"
    >
      <CalculatorIcon class="h-4 w-4" />
      FX Calculator
    </button>

    <div v-else class="w-80 overflow-hidden rounded-2xl border border-line bg-elevated shadow-2xl">
      <div class="flex items-center justify-between border-b border-line bg-brand px-5 py-3.5">
        <div class="flex items-center gap-2 text-brand-fg">
          <CalculatorIcon class="h-4 w-4 opacity-70" />
          <h3 class="font-display text-sm font-semibold">Exchange rate</h3>
        </div>
        <button class="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white" @click="open = false">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-4 p-5">
        <label class="block">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Rate</span>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="text-sm text-muted">1 USD =</span>
            <input
              :value="store.usdRate"
              type="number"
              min="0"
              step="0.01"
              class="input-field flex-1 font-mono-nums font-semibold"
              @input="updateRate(parseFloat(($event.target as HTMLInputElement).value) || 0)"
            />
            <span class="text-sm font-semibold text-brand">Br</span>
          </div>
        </label>

        <div class="h-px bg-line" />

        <label class="block">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">USD → Birr</span>
          <input
            v-model="usdInput"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            class="input-field mt-1.5 font-mono-nums"
          />
          <p v-if="usdValue > 0" class="mt-2 text-sm text-muted">
            = <span class="font-mono-nums font-semibold text-birr">{{ formatAmount(usdToBr, 'Br') }}</span>
          </p>
        </label>

        <label class="block">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Birr → USD</span>
          <input
            v-model="brInput"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            class="input-field mt-1.5 font-mono-nums"
          />
          <p v-if="brValue > 0" class="mt-2 text-sm text-muted">
            = <span class="font-mono-nums font-semibold text-usd">{{ formatAmount(brToUsd, 'USD') }}</span>
          </p>
        </label>
      </div>
    </div>
  </div>
</template>
