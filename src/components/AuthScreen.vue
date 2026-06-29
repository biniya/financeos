<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { BRAND } from '@/brand/tokens'
import BrandLogo from './brand/BrandLogo.vue'

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const submitting = ref(false)

async function submit() {
  if (!email.value || !password.value) return
  submitting.value = true
  try {
    await auth.signIn(email.value, password.value)
  } catch {
    /* error shown via auth.authError */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md overflow-hidden rounded-2xl bg-elevated shadow-2xl ring-1 ring-black/[0.06]">
      <div class="bg-brand px-8 py-10">
        <BrandLogo size="lg" variant="light" />
        <p class="mt-6 text-sm leading-relaxed text-white/55">
          {{ isSupabaseConfigured ? 'Sign in to access your plans and sync across devices.' : 'Cloud storage is not configured.' }}
        </p>
      </div>

      <form v-if="isSupabaseConfigured" class="space-y-5 p-8" @submit.prevent="submit">
        <label class="block">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Email</span>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="input-field mt-1.5"
          />
        </label>

        <label class="block">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Password</span>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            autocomplete="current-password"
            class="input-field mt-1.5"
          />
        </label>

        <p v-if="auth.authError" class="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
          {{ auth.authError }}
        </p>

        <button type="submit" :disabled="submitting" class="btn-primary w-full !py-3 !text-sm">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>

        <p class="text-center text-[11px] text-muted">{{ BRAND.tagline }}</p>
      </form>

      <div v-else class="space-y-3 p-8 text-sm text-muted">
        <p>Add your Supabase credentials to <code class="rounded bg-surface px-1.5 py-0.5 text-xs text-brand">.env.local</code> to enable cloud sync.</p>
      </div>
    </div>
  </div>
</template>
