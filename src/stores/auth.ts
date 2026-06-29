import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const requiresAuth = computed(() => isSupabaseConfigured)

  async function init() {
    if (!supabase) {
      loading.value = false
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    loading.value = false
  }

  async function signIn(email: string, password: string) {
    authError.value = null
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) {
      authError.value = error.message
      throw error
    }
    user.value = data.user
    return data
  }

  async function signOut() {
    authError.value = null
    await supabase!.auth.signOut()
    user.value = null
  }

  return {
    user,
    loading,
    authError,
    isAuthenticated,
    requiresAuth,
    init,
    signIn,
    signOut,
  }
})
