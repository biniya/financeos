<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

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
  <div class="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4">
    <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 text-center text-white">
        <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
          F
        </div>
        <h1 class="text-lg font-semibold">FinanceOS</h1>
        <p class="mt-1 text-xs text-white/50">
          {{ isSupabaseConfigured ? 'Sign in to access your plans' : 'Cloud not configured' }}
        </p>
      </div>

      <form v-if="isSupabaseConfigured" class="space-y-4 p-6" @submit.prevent="submit">
        <label class="block">
          <span class="text-xs text-slate-500">Email</span>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </label>

        <label class="block">
          <span class="text-xs text-slate-500">Password</span>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            autocomplete="current-password"
            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </label>

        <p v-if="auth.authError" class="text-xs text-red-600">{{ auth.authError }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {{ submitting ? 'Please wait…' : 'Sign in' }}
        </button>
      </form>

      <div v-else class="space-y-3 p-6 text-sm text-slate-600">
        <p>Add <code class="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> and
          <code class="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> to enable cloud sync.</p>
        <p class="text-xs text-slate-400">Without them, the app uses browser local storage only.</p>
      </div>
    </div>
  </div>
</template>
