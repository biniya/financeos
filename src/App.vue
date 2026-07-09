<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/classification'
import { useTransactionsStore } from '@/stores/transactions'
import { isSupabaseConfigured } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell.vue'
import AuthScreen from '@/components/AuthScreen.vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'

const auth = useAuthStore()
const plans = usePlansStore()
const transactions = useTransactionsStore()

const loading = computed(() => auth.loading || !plans.ready || !transactions.ready)

onMounted(async () => {
  await auth.init()
  await Promise.all([plans.init(), transactions.init()])
})

watch(
  () => auth.user?.id,
  async (userId, prevId) => {
    if (userId && userId !== prevId) {
      await Promise.all([plans.onUserSignedIn(userId), transactions.onUserSignedIn(userId)])
    } else if (!userId && prevId) {
      plans.onUserSignedOut()
      transactions.onUserSignedOut()
    }
  },
)
</script>

<template>
  <div v-if="loading" class="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
    <BrandLogo size="md" />
    <p class="text-sm text-muted">Loading your workspace…</p>
  </div>

  <AuthScreen v-else-if="isSupabaseConfigured && !auth.isAuthenticated" />

  <AppShell v-else-if="plans.activePlan" />
</template>
