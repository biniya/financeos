<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatNumber, parseFormattedNumber } from '@/utils/format'

const props = defineProps<{
  modelValue: number
  currency: 'Br' | 'USD'
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number]; blur: [] }>()

const focused = ref(false)
const text = ref(formatNumber(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    if (!focused.value) text.value = formatNumber(v)
  },
  { immediate: true },
)

function onFocus() {
  focused.value = true
  text.value = formatNumber(props.modelValue)
}

function onBlur() {
  focused.value = false
  const n = parseFormattedNumber(text.value)
  emit('update:modelValue', n)
  text.value = formatNumber(n)
  emit('blur')
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = parseFormattedNumber(raw)
  emit('update:modelValue', n)
  text.value = formatNumber(n)
}
</script>

<template>
  <input
    :value="text"
    type="text"
    inputmode="decimal"
    class="input-field font-mono-nums py-1.5 text-base font-semibold"
    autofocus
    @focus="onFocus"
    @blur="onBlur"
    @input="onInput"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
  />
</template>
