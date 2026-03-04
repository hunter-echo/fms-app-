'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react'
import { getCustomers, getJobs, createInvoice } from '@/lib/data'
import type { Customer, Job } from '@/lib/types'
import { Suspense } from 'react'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const linkedJobId = searchParams.get('job') || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ])
  const [form, setForm] = useState({
    customer_id: '',
    job_id: linkedJobId,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
    notes: 'Thank you for choosing Mountain Climate HVAC!',
    status: 'sent' as const,
  })
  const TAX_RATE = 0.08

  useEffect(() => {
    Promise.all([getCustomers(), getJobs()]).then(([c, j]) => {
      setCustomers(c)
      setJobs(j)
      // If linked job, pre-fill customer
      if (linkedJobId) {
        const linkedJob = j.find(job => job.id === linkedJobId)
        if (linkedJob) setForm(prev => ({ ...prev, customer_id: linkedJob.customer_id || '' }))
      }
    })
  }, [linkedJobId])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const addLine = () => setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }])
  const removeLine = (id: string) => setLineItems(prev => prev.filter(l => l.id !== id))
  const updateLine = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'sent') => {
    e.preventDefault()
    if (!form.customer_id) { setError('Please select a customer.'); return }
    setSaving(true)
    setError('')

    const invoiceData = {
      customer_id: form.customer_id,
      job_id: form.job_id || undefined,
      due_date: form.due_date,
      notes: form.notes,
      status,
      line_items: lineItems.map(l => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total: l.quantity * l.unit_price,
      })),
      subtotal,
      tax_rate: TAX_RATE,
      tax_amount: tax,
      total,
    }

    const result = await createInvoice(invoiceData as any)
    if (result) {
      router.push('/invoices')
    } else {
      setError('Failed to save invoice. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 text-sm">Create and send an invoice</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <form className="space-y-5">
        {/* Customer + Job */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bill To</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={form.customer_id}
                onChange={e => set('customer_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Job</label>
              <select
                value={form.job_id}
                onChange={e => set('job_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>
            {lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input type="text" placeholder="Service or part"
                  value={item.description} onChange={e => updateLine(item.id, 'description', e.target.value)}
                  className="col-span-6 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0.5" step="0.5"
                  value={item.quantity} onChange={e => updateLine(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                <input type="number" min="0" step="0.01"
                  value={item.unit_price} onChange={e => updateLine(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                <div className="col-span-1 text-sm text-gray-700 text-right font-medium">
                  ${(item.quantity * item.unit_price).toFixed(0)}
                </div>
                <button type="button" onClick={() => removeLine(item.id)}
                  className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 mt-2">
              <Plus size={14} />Add line item
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={e => handleSubmit(e, 'sent')}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Send size={16} />{saving ? 'Saving...' : 'Save & Send Invoice'}
          </button>
          <button
            onClick={e => handleSubmit(e, 'draft')}
            disabled={saving}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Save Draft
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400 text-sm">Loading...</div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}
