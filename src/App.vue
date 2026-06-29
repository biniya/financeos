<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/classification'
import { isSupabaseConfigured } from '@/lib/supabase'
import AuthScreen from '@/components/AuthScreen.vue'
import ClassificationTree from '@/components/ClassificationTree.vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'

const auth = useAuthStore()
const plans = usePlansStore()

onMounted(async () => {
  await auth.init()
  await plans.init()
})

watch(
  () => auth.user?.id,
  async (userId, prevId) => {
    if (userId && userId !== prevId) {
      await plans.onUserSignedIn(userId)
    } else if (!userId && prevId) {
      plans.onUserSignedOut()
    }
  },
)
</script>

<template>
  <div v-if="auth.loading || !plans.ready" class="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
    <BrandLogo size="md" />
    <p class="text-sm text-muted">Loading your workspace…</p>
  </div>

  <AuthScreen v-else-if="isSupabaseConfigured && !auth.isAuthenticated" />

  <ClassificationTree v-else-if="plans.activePlan" />

  <div v-else class="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
    <BrandLogo size="md" />
    <p class="text-sm text-muted">Loading plans…</p>
  </div>
</template>
