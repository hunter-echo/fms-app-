'use client'

import { getSupabase } from './supabase'

export async function signIn(email: string, password: string) {
  const sb = getSupabase()
  if (!sb) return { error: 'Not configured' }
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  return { data, error: error?.message }
}

export async function signOut() {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

export async function getUser() {
  const sb = getSupabase()
  if (!sb) return null
  const { data: { user } } = await sb.auth.getUser()
  return user
}
