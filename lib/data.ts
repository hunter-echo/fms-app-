'use client'

import { getSupabase, MOCK_DATA } from './supabase'
import type { Customer, Job, Invoice, Technician } from './types'

// ─── CUSTOMERS ─────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const sb = getSupabase()
  if (!sb) return MOCK_DATA.customers as Customer[]
  const { data, error } = await sb.from('customers').select('*').order('name')
  if (error) { console.error(error); return MOCK_DATA.customers as Customer[] }
  return data as Customer[]
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('customers').insert(customer).select().single()
  if (error) { console.error(error); return null }
  return data as Customer
}

// ─── JOBS ───────────────────────────────────────────────────────────────────

export async function getJobs(): Promise<Job[]> {
  const sb = getSupabase()
  if (!sb) return MOCK_DATA.jobs as Job[]
  const { data, error } = await sb
    .from('jobs')
    .select('*, customer:customers(*), technician:technicians(*)')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return MOCK_DATA.jobs as Job[] }
  return data as Job[]
}

export async function getJob(id: string): Promise<Job | null> {
  const sb = getSupabase()
  if (!sb) return (MOCK_DATA.jobs.find(j => j.id === id) as Job) || null
  const { data, error } = await sb
    .from('jobs')
    .select('*, customer:customers(*), technician:technicians(*)')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data as Job
}

export async function createJob(job: Omit<Job, 'id' | 'created_at' | 'job_number'>): Promise<Job | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('jobs').insert(job).select().single()
  if (error) { console.error(error); return null }
  return data as Job
}

export async function updateJobStatus(id: string, status: Job['status'], notes?: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const update: Partial<Job> = { status }
  if (notes !== undefined) update.notes = notes
  if (status === 'completed') update.completed_at = new Date().toISOString()
  const { error } = await sb.from('jobs').update(update).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function updateJob(id: string, data: Partial<Job>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('jobs').update(data).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('customers').update(data).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ─── INVOICES ───────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
  const sb = getSupabase()
  if (!sb) return MOCK_DATA.invoices as Invoice[]
  const { data, error } = await sb
    .from('invoices')
    .select('*, customer:customers(*), job:jobs(*)')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return MOCK_DATA.invoices as Invoice[] }
  return data as Invoice[]
}

export async function createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'invoice_number'>): Promise<Invoice | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('invoices').insert(invoice).select().single()
  if (error) { console.error(error); return null }
  return data as Invoice
}

// ─── TECHNICIANS ────────────────────────────────────────────────────────────

export async function getTechnicians(): Promise<Technician[]> {
  const sb = getSupabase()
  if (!sb) return MOCK_DATA.technicians as Technician[]
  const { data, error } = await sb.from('technicians').select('*').eq('active', true).order('name')
  if (error) { console.error(error); return MOCK_DATA.technicians as Technician[] }
  return data as Technician[]
}
