import { nextTick, type Ref } from 'vue'

export async function printPlan(editorVisible: Ref<boolean>) {
  const wasEditing = editorVisible.value
  editorVisible.value = false
  await nextTick()
  document.title = `FinanceOS — ${document.querySelector('[data-company-name]')?.textContent?.trim() || 'Plan'}`
  window.print()
  editorVisible.value = wasEditing
}
