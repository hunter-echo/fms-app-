'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCustomers, getJobs, createEstimate } from '@/lib/data'
import type { Customer, Job } from '@/lib/types'
import { ArrowLeft, Plus, Trash2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CatalogPicker from '@/components/CatalogPicker'
import type { CatalogItem } from '@/lib/types'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

function NewEstimateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const linkedJobId = searchParams.get('job') || ''
  const linkedCustomerId = searchParams.get('customer') || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCatalog, setShowCatalog] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ])
  const [form, setForm] = useState({
    customer_id: linkedCustomerId,
    job_id: linkedJobId,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Thank you for choosing Mountain Climate HVAC! This estimate is valid for 30 days.',
    status: 'draft' as const,
  })
  const TAX_RATE = 0.08

  useEffect(() => {
    Promise.all([getCustomers(), getJobs()]).then(([c, j]) => {
      setCustomers(c)
      setJobs(j)
      if (linkedJobId && !linkedCustomerId) {
        const job = j.find(job => job.id === linkedJobId)
        if (job) setForm(prev => ({ ...prev, customer_id: job.customer_id || '' }))
      }
    })
  }, [linkedJobId, linkedCustomerId])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const addLine = () => setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }])
  const addFromCatalog = (item: CatalogItem) => {
    setLineItems(prev => [...prev, { id: Date.now().toString(), description: item.name, quantity: 1, unit_price: item.unit_price }])
  }
  const removeLine = (id: string) => setLineItems(prev => prev.filter(l => l.id !== id))
  const updateLine = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'sent') => {
    e.preventDefault()
    if (!form.customer_id) { setError('Please select a customer'); return }
    setSaving(true)
    setError('')
    const cleanItems = lineItems.filter(l => l.description.trim()).map(l => ({
      id: l.id, description: l.description, quantity: l.quantity,
      unit_price: l.unit_price, total: l.quantity * l.unit_price,
    }))
    const result = await createEstimate({
      customer_id: form.customer_id,
      job_id: form.job_id || undefined,
      status,
      line_items: cleanItems,
      subtotal,
      tax_rate: TAX_RATE,
      tax_amount: tax,
      total,
      notes: form.notes,
      valid_until: form.valid_until || undefined,
    })
    if (result) router.push(`/estimates/${result.id}`)
    else { setError('Failed to save. Try again.'); setSaving(false) }
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/estimates" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Estimate</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <form className="space-y-4">
        {/* Customer & Job */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Customer</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Customer *</label>
              <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className={inputClass}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Linked Job (optional)</label>
              <select value={form.job_id} onChange={e => set('job_id', e.target.value)} className={inputClass}>
                <option value="">No linked job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Line Items</h2>
            <button type="button" onClick={() => setShowCatalog(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <BookOpen size={13} />Price Book
            </button>
          </div>
          <div className="mb-2 hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price</span>
            <span className="col-span-1 text-right">Total</span>
          </div>
          <div className="space-y-2">
            {lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input type="text" placeholder="Service or part description"
                  value={item.description} onChange={e => updateLine(item.id, 'description', e.target.value)}
                  className="col-span-6 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0.5" step="0.5"
                  value={item.quantity} onChange={e => updateLine(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                <input type="number" min="0" step="0.01"
                  value={item.unit_price} onChange={e => updateLine(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                <div className="col-span-1 text-sm text-gray-700 dark:text-red-400 text-right font-medium">
                  ${(item.quantity * item.unit_price).toFixed(0)}
                </div>
                <button type="button" onClick={() => removeLine(item.id)}
                  className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLine}
            className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 mt-3 font-medium">
            <Plus size={14} />Add line item
          </button>

          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span className="dark:text-red-400">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Tax (8%)</span><span className="dark:text-red-400">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span><span className="dark:text-red-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Notes</h2>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={e => handleSubmit(e, 'sent')} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : 'Save & Send to Customer'}
          </button>
          <button onClick={e => handleSubmit(e, 'draft')} disabled={saving}
            className="px-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60">
            Save Draft
          </button>
        </div>
      </form>
      {showCatalog && <CatalogPicker onSelect={addFromCatalog} onClose={() => setShowCatalog(false)} />}
    </div>
  )
}

export default function NewEstimatePage() {
  return <Suspense fallback={<div className="p-6 dark:bg-gray-950 min-h-screen animate-pulse" />}><NewEstimateForm /></Suspense>
}

