'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ])
  const TAX_RATE = 0.08

  const addLine = () =>
    setLineItems([...lineItems, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }])

  const removeLine = (id: string) => setLineItems(lineItems.filter((l) => l.id !== id))

  const updateLine = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(lineItems.map((l) => (l.id === id ? { ...l, [field]: value } : l)))

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => router.push('/invoices'), 1200)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 text-sm">INV-{String(MOCK_DATA.invoices.length + 1).padStart(3, '0')}</p>
        </div>
      </div>

      {sent && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ Invoice sent!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer + Job */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bill To</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select customer...</option>
                {MOCK_DATA.customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Job (optional)</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">None</option>
                {MOCK_DATA.jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.job_number} — {j.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  defaultValue={new Date(Date.now() + 2592000000).toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Service or part description"
                  value={item.description}
                  onChange={(e) => updateLine(item.id, 'description', e.target.value)}
                  className="col-span-6 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={item.quantity}
                  onChange={(e) => updateLine(item.id, 'quantity', parseFloat(e.target.value))}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateLine(item.id, 'unit_price', parseFloat(e.target.value))}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <div className="col-span-1 text-sm text-gray-700 text-right font-medium">
                  ${(item.quantity * item.unit_price).toFixed(0)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(item.id)}
                  className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 transition-colors mt-2"
            >
              <Plus size={14} />
              Add line item
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
          <textarea
            rows={2}
            placeholder="Payment terms, warranty info, thank you message..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Send size={16} />
            Save & Send Invoice
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
        </div>
      </form>
    </div>
  )
}
