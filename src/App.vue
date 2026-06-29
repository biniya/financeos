<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/classification'
import { isSupabaseConfigured } from '@/lib/supabase'
import AuthScreen from '@/components/AuthScreen.vue'
import ClassificationTree from '@/components/ClassificationTree.vue'

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
  <div v-if="auth.loading || !plans.ready" class="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
    <p class="text-sm text-slate-400">Loading…</p>
  </div>

  <AuthScreen v-else-if="isSupabaseConfigured && !auth.isAuthenticated" />

  <ClassificationTree v-else-if="plans.activePlan" />

  <div v-else class="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
    <p class="text-sm text-slate-400">Loading plans…</p>
  </div>
</template>
