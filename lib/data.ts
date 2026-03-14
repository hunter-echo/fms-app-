'use client'

import { getSupabase, MOCK_DATA } from './supabase'
import type { Customer, Job, Invoice, Technician, SheetTemplate, JobSheet, Estimate, CatalogItem } from './types'

// ─── MOCK TEMPLATES ─────────────────────────────────────────────────────────

const MOCK_TEMPLATES: SheetTemplate[] = [
  {
    id: 'tpl-1', name: 'Furnace Tune-Up', description: 'Annual furnace maintenance checklist',
    created_at: new Date().toISOString(),
    fields: [
      { id: 'filter', type: 'select', label: 'Filter Condition', options: ['Clean', 'Dirty - Replaced', 'Dirty - Customer to replace'] },
      { id: 'heat_exchanger', type: 'select', label: 'Heat Exchanger', options: ['Pass', 'Crack Found', 'Not Accessible'] },
      { id: 'burners', type: 'select', label: 'Burner Condition', options: ['Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'igniter', type: 'select', label: 'Igniter Condition', options: ['Good', 'Worn', 'Failed - Replaced'] },
      { id: 'gas_inlet', type: 'number', label: 'Gas Inlet Pressure (in. WC)' },
      { id: 'gas_manifold', type: 'number', label: 'Gas Manifold Pressure (in. WC)' },
      { id: 'supply_temp', type: 'number', label: 'Supply Air Temp (°F)' },
      { id: 'return_temp', type: 'number', label: 'Return Air Temp (°F)' },
      { id: 'temp_rise', type: 'number', label: 'Temperature Rise (°F)' },
      { id: 'co_reading', type: 'number', label: 'CO Reading (PPM)' },
      { id: 'blower_amps', type: 'number', label: 'Blower Motor Amps' },
      { id: 'flue_pipe', type: 'select', label: 'Flue Pipe Condition', options: ['Good', 'Needs Repair', 'Replaced'] },
      { id: 'drain_lines', type: 'checkbox', label: 'Drain Lines Clear' },
      { id: 'electrical', type: 'checkbox', label: 'Electrical Connections Tight' },
      { id: 'thermostat', type: 'checkbox', label: 'Thermostat Calibrated' },
      { id: 'safety_controls', type: 'checkbox', label: 'Safety Controls Tested' },
      { id: 'notes', type: 'textarea', label: 'Tech Notes' },
    ],
  },
  {
    id: 'tpl-2', name: 'A/C Tune-Up', description: 'Annual air conditioning maintenance checklist',
    created_at: new Date().toISOString(),
    fields: [
      { id: 'refrigerant_type', type: 'select', label: 'Refrigerant Type', options: ['R-22', 'R-410A', 'R-32', 'R-407C'] },
      { id: 'filter', type: 'select', label: 'Filter Condition', options: ['Clean', 'Dirty - Replaced', 'Dirty - Customer to replace'] },
      { id: 'suction_pressure', type: 'number', label: 'Suction Pressure (PSI)' },
      { id: 'discharge_pressure', type: 'number', label: 'Discharge Pressure (PSI)' },
      { id: 'suction_line_temp', type: 'number', label: 'Suction Line Temp (°F)' },
      { id: 'liquid_line_temp', type: 'number', label: 'Liquid Line Temp (°F)' },
      { id: 'superheat', type: 'number', label: 'Superheat (°F)' },
      { id: 'subcooling', type: 'number', label: 'Subcooling (°F)' },
      { id: 'supply_temp', type: 'number', label: 'Supply Air Temp (°F)' },
      { id: 'return_temp', type: 'number', label: 'Return Air Temp (°F)' },
      { id: 'delta_t', type: 'number', label: 'Delta T (°F)' },
      { id: 'condenser_fan_amps', type: 'number', label: 'Condenser Fan Motor Amps' },
      { id: 'blower_amps', type: 'number', label: 'Blower Motor Amps' },
      { id: 'condenser_coil', type: 'select', label: 'Condenser Coil', options: ['Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'evaporator_coil', type: 'select', label: 'Evaporator Coil', options: ['Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'capacitor', type: 'select', label: 'Capacitor', options: ['Good', 'Weak - Replaced', 'Failed - Replaced'] },
      { id: 'contactor', type: 'select', label: 'Contactor', options: ['Good', 'Pitted - Replaced', 'Failed - Replaced'] },
      { id: 'drain_line', type: 'checkbox', label: 'Drain Line Clear' },
      { id: 'electrical', type: 'checkbox', label: 'Electrical Connections Tight' },
      { id: 'notes', type: 'textarea', label: 'Tech Notes' },
    ],
  },
  {
    id: 'tpl-3', name: 'Rooftop Unit Tune-Up', description: 'Commercial RTU maintenance checklist',
    created_at: new Date().toISOString(),
    fields: [
      { id: 'unit_model', type: 'text', label: 'Unit Model #' },
      { id: 'unit_serial', type: 'text', label: 'Unit Serial #' },
      { id: 'refrigerant_type', type: 'select', label: 'Refrigerant Type', options: ['R-22', 'R-410A', 'R-407C'] },
      { id: 'filter', type: 'select', label: 'Filter Condition', options: ['Clean', 'Dirty - Replaced', 'Dirty - Customer to replace'] },
      { id: 'suction_pressure', type: 'number', label: 'Suction Pressure (PSI)' },
      { id: 'discharge_pressure', type: 'number', label: 'Discharge Pressure (PSI)' },
      { id: 'superheat', type: 'number', label: 'Superheat (°F)' },
      { id: 'subcooling', type: 'number', label: 'Subcooling (°F)' },
      { id: 'supply_temp', type: 'number', label: 'Supply Air Temp (°F)' },
      { id: 'return_temp', type: 'number', label: 'Return Air Temp (°F)' },
      { id: 'delta_t', type: 'number', label: 'Delta T (°F)' },
      { id: 'condenser_coils', type: 'select', label: 'Condenser Coils', options: ['Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'evaporator_coils', type: 'select', label: 'Evaporator Coils', options: ['Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'gas_heat', type: 'select', label: 'Gas Heat', options: ['N/A', 'Operating Normal', 'Needs Service'] },
      { id: 'heat_exchanger', type: 'select', label: 'Heat Exchanger', options: ['N/A', 'Pass', 'Crack Found'] },
      { id: 'burners', type: 'select', label: 'Burners', options: ['N/A', 'Clean', 'Dirty - Cleaned', 'Needs Service'] },
      { id: 'economizer', type: 'select', label: 'Economizer', options: ['N/A', 'Operating Normal', 'Needs Service'] },
      { id: 'belts_bearings', type: 'select', label: 'Belts & Bearings', options: ['Good', 'Worn - Replaced', 'Needs Service'] },
      { id: 'drain_pan', type: 'select', label: 'Drain Pan/Lines', options: ['Clear', 'Blocked - Cleared', 'Needs Service'] },
      { id: 'electrical', type: 'checkbox', label: 'Electrical Connections Tight' },
      { id: 'notes', type: 'textarea', label: 'Tech Notes' },
    ],
  },
]

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

// ─── SHEET TEMPLATES ────────────────────────────────────────────────────────

export async function getSheetTemplates(): Promise<SheetTemplate[]> {
  const sb = getSupabase()
  if (!sb) return MOCK_TEMPLATES
  const { data, error } = await sb.from('sheet_templates').select('*').order('created_at')
  if (error) { console.error(error); return MOCK_TEMPLATES }
  return (data || []).map(t => ({ ...t, fields: t.fields || [] })) as SheetTemplate[]
}

export async function getSheetTemplate(id: string): Promise<SheetTemplate | null> {
  const sb = getSupabase()
  if (!sb) return MOCK_TEMPLATES.find(t => t.id === id) || null
  const { data, error } = await sb.from('sheet_templates').select('*').eq('id', id).single()
  if (error) { console.error(error); return null }
  return { ...data, fields: data.fields || [] } as SheetTemplate
}

export async function createSheetTemplate(template: Omit<SheetTemplate, 'id' | 'created_at'>): Promise<SheetTemplate | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('sheet_templates').insert(template).select().single()
  if (error) { console.error(error); return null }
  return data as SheetTemplate
}

export async function updateSheetTemplate(id: string, updates: Partial<SheetTemplate>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('sheet_templates').update(updates).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function deleteSheetTemplate(id: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('sheet_templates').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ─── JOB SHEETS ─────────────────────────────────────────────────────────────

export async function getJobSheets(jobId: string): Promise<JobSheet[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb.from('job_sheets').select('*').eq('job_id', jobId).order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data || []).map(s => ({ ...s, responses: s.responses || {}, photos: s.photos || [] })) as JobSheet[]
}

export async function getJobSheet(id: string): Promise<JobSheet | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('job_sheets').select('*').eq('id', id).single()
  if (error) { console.error(error); return null }
  return { ...data, responses: data.responses || {}, photos: data.photos || [] } as JobSheet
}

export async function getJobSheetWithDetails(id: string): Promise<(JobSheet & { job?: Job & { customer?: Customer } }) | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('job_sheets')
    .select('*, job:jobs(*, customer:customers(*))')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return { ...data, responses: data.responses || {}, photos: data.photos || [] }
}

export async function createJobSheet(sheet: Omit<JobSheet, 'id' | 'created_at'>): Promise<JobSheet | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('job_sheets').insert(sheet).select().single()
  if (error) { console.error(error); return null }
  return data as JobSheet
}

export async function updateJobSheet(id: string, updates: Partial<JobSheet>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('job_sheets').update(updates).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ─── PRICE BOOK ──────────────────────────────────────────────────────────────

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb.from('line_item_catalog').select('*').eq('active', true).order('category').order('name')
  if (error) { console.error(error); return [] }
  return data as CatalogItem[]
}

export async function createCatalogItem(item: Omit<CatalogItem, 'id' | 'created_at'>): Promise<CatalogItem | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('line_item_catalog').insert(item).select().single()
  if (error) { console.error(error); return null }
  return data as CatalogItem
}

export async function updateCatalogItem(id: string, updates: Partial<CatalogItem>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('line_item_catalog').update(updates).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('line_item_catalog').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ─── ESTIMATES ───────────────────────────────────────────────────────────────

export async function getEstimates(): Promise<Estimate[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('estimates')
    .select('*, customer:customers(*), job:jobs(*)')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data as Estimate[]
}

export async function getEstimate(id: string): Promise<Estimate | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('estimates')
    .select('*, customer:customers(*), job:jobs(*)')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data as Estimate
}

export async function createEstimate(estimate: Omit<Estimate, 'id' | 'created_at' | 'estimate_number'>): Promise<Estimate | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('estimates').insert(estimate).select().single()
  if (error) { console.error(error); return null }
  return data as Estimate
}

export async function updateEstimate(id: string, updates: Partial<Estimate>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return true
  const { error } = await sb.from('estimates').update(updates).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function getPendingReviewSheets(): Promise<(JobSheet & { job?: Job & { customer?: Customer } })[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('job_sheets')
    .select('*, job:jobs(*, customer:customers(*))')
    .eq('status', 'pending_review')
    .order('completed_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return (data || []).map(s => ({ ...s, responses: s.responses || {}, photos: s.photos || [] }))
}
