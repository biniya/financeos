<script setup lang="ts">
import { BRAND } from '@/brand/tokens'

withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    variant?: 'light' | 'dark'
  }>(),
  { size: 'md', variant: 'dark' },
)

const sizes = {
  sm: { mark: 'h-7 w-7 text-[10px]', title: 'text-sm', tag: 'text-[9px]' },
  md: { mark: 'h-9 w-9 text-xs', title: 'text-base', tag: 'text-[10px]' },
  lg: { mark: 'h-12 w-12 text-sm', title: 'text-xl', tag: 'text-xs' },
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="brand-mark flex shrink-0 items-center justify-center rounded-[10px] font-bold"
      :class="[
        sizes[size].mark,
        variant === 'light' ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-brand text-brand-fg shadow-sm',
      ]"
    >
      F
    </div>
    <div v-if="!$slots.default" class="min-w-0">
      <p
        class="brand-title font-display font-semibold leading-none tracking-tight"
        :class="[sizes[size].title, variant === 'light' ? 'text-white' : 'text-ink']"
      >
        {{ BRAND.name }}
      </p>
      <p
        class="mt-1 font-medium uppercase tracking-[0.18em]"
        :class="[sizes[size].tag, variant === 'light' ? 'text-white/55' : 'text-muted']"
      >
        {{ BRAND.tagline }}
      </p>
    </div>
    <slot />
  </div>
</template>
