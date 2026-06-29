import { supabase } from '@/lib/supabase'
import type { CompanyData, SavedPlan } from '@/types'

interface PlanRow {
  id: string
  user_id: string
  label: string
  data: CompanyData
  created_at: string
  updated_at: string
}

interface SettingsRow {
  user_id: string
  active_plan_id: string | null
  usd_rate: number
  updated_at: string
}

function toPlan(row: PlanRow): SavedPlan {
  return {
    id: row.id,
    label: row.label,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchPlans(userId: string): Promise<SavedPlan[]> {
  const { data, error } = await supabase!
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as PlanRow[]).map(toPlan)
}

export async function upsertPlan(userId: string, plan: SavedPlan): Promise<void> {
  const { error } = await supabase!
    .from('plans')
    .upsert({
      id: plan.id,
      user_id: userId,
      label: plan.label,
      data: plan.data,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    })

  if (error) throw error
}

export async function deletePlanRemote(planId: string): Promise<void> {
  const { error } = await supabase!.from('plans').delete().eq('id', planId)
  if (error) throw error
}

export async function fetchSettings(userId: string): Promise<SettingsRow | null> {
  const { data, error } = await supabase!
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as SettingsRow | null
}

export async function upsertSettings(
  userId: string,
  patch: { active_plan_id?: string | null; usd_rate?: number },
): Promise<void> {
  const { error } = await supabase!
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}
