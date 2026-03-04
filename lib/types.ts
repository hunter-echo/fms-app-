export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type JobPriority = 'low' | 'medium' | 'high' | 'emergency'

export interface Customer {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  notes?: string
}

export interface Technician {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  color: string // for calendar display
  active: boolean
}

export interface Job {
  id: string
  created_at: string
  job_number: string
  customer_id: string
  customer?: Customer
  technician_id?: string
  technician?: Technician
  title: string
  description: string
  status: JobStatus
  priority: JobPriority
  scheduled_date?: string
  scheduled_time?: string
  estimated_duration?: number // minutes
  address: string
  city: string
  state: string
  zip: string
  notes?: string
  photos?: string[]
  completed_at?: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  created_at: string
  invoice_number: string
  job_id?: string
  job?: Job
  customer_id: string
  customer?: Customer
  status: InvoiceStatus
  line_items: InvoiceLineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date: string
  paid_at?: string
  notes?: string
  stripe_payment_intent_id?: string
}

// ─── SHEETS ─────────────────────────────────────────────────────────────────

export interface SheetField {
  id: string
  type: 'checkbox' | 'text' | 'number' | 'select' | 'textarea'
  label: string
  options?: string[]
}

export interface SheetTemplate {
  id: string
  name: string
  description?: string
  fields: SheetField[]
  created_at: string
}

export interface JobSheet {
  id: string
  job_id: string
  template_id?: string
  template_name: string
  responses: Record<string, string | boolean | number>
  photos: string[]
  status: 'in_progress' | 'completed'
  notes?: string
  completed_at?: string
  created_at: string
}

export interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedToday: number
  pendingInvoices: number
  revenueThisMonth: number
  scheduledToday: number
}
