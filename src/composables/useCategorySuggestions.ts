import { computed } from 'vue'
import { usePlansStore } from '@/stores/classification'
import { useTransactionsStore } from '@/stores/transactions'
import { DEFAULT_CLASSIFICATIONS } from '@/types/transactions'

export function useCategorySuggestions() {
  const plans = usePlansStore()
  const txStore = useTransactionsStore()

  const planClassifications = computed(() =>
    (plans.data?.classifications ?? []).map((c) => c.name).filter(Boolean),
  )

  const planCategories = computed(() => {
    const names = new Set<string>()
    for (const cls of plans.data?.classifications ?? []) {
      for (const cat of cls.categories) {
        if (cat.name.trim()) names.add(cat.name.trim())
      }
    }
    return [...names].sort()
  })

  const classificationOptions = computed(() => {
    const set = new Set<string>([...DEFAULT_CLASSIFICATIONS, ...planClassifications.value, ...txStore.classifications])
    return [...set].sort()
  })

  const categoryOptions = computed(() => {
    const set = new Set<string>([...planCategories.value, ...txStore.categories])
    return [...set].sort()
  })

  function categoriesForClassification(classification: string): string[] {
    const cls = plans.data?.classifications.find(
      (c) => c.name.toLowerCase() === classification.trim().toLowerCase(),
    )
    if (!cls) return categoryOptions.value
    const names = cls.categories.map((c) => c.name).filter(Boolean)
    return names.length ? names : categoryOptions.value
  }

  return {
    classificationOptions,
    categoryOptions,
    categoriesForClassification,
  }
}
