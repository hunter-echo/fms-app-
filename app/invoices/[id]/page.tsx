'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getInvoices, getCustomers } from '@/lib/data'
import type { Invoice, Customer } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Download, Send, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

const statusStyles: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'bg-gray-100 text-gray-600', label: 'Draft' },
  sent: { badge: 'bg-blue-100 text-blue-700', label: 'Sent' },
  paid: { badge: 'bg-green-100 text-green-700', label: 'Paid' },
  overdue: { badge: 'bg-red-100 text-red-700', label: 'Overdue' },
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([getInvoices(), getCustomers()]).then(([invoices, customers]) => {
      const found = invoices.find(i => i.id === id)
      setInvoice(found || null)
      if (found) setCustomer(customers.find(c => c.id === found.customer_id) || null)
      setLoading(false)
    })
  }, [id])

  const markAs = async (status: Invoice['status']) => {
    setUpdating(true)
    const sb = getSupabase()
    if (sb) {
      const update: Record<string, string> = { status }
      if (status === 'paid') update.paid_at = new Date().toISOString()
      await sb.from('invoices').update(update).eq('id', id)
      setInvoice(prev => prev ? { ...prev, status, ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}) } : prev)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Invoice not found.</p>
        <Link href="/invoices" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </div>
    )
  }

  const style = statusStyles[invoice.status] || statusStyles.draft

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>{style.label}</span>
          </div>
          <p className="text-gray-500 text-sm">Due {format(new Date(invoice.due_date), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ Invoice updated
        </div>
      )}

      <div className="space-y-4">
        {/* Invoice Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-bold text-gray-900 text-lg">Mountain Climate HVAC</div>
              <div className="text-sm text-gray-500 mt-0.5">Denver, CO</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">${invoice.total.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total Due</div>
            </div>
          </div>

          {customer && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-1">BILL TO</p>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              {customer.address && (
                <p className="text-sm text-gray-500">{customer.address}, {customer.city}, {customer.state}</p>
              )}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="space-y-3">
            {(invoice.line_items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.description || 'Service'}</p>
                  <p className="text-gray-400 text-xs">
                    {item.quantity} × ${item.unit_price?.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 shrink-0">${(item.total || item.quantity * item.unit_price || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%)</span>
              <span>${invoice.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Status Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Update Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {invoice.status !== 'paid' && (
              <button
                onClick={() => markAs('paid')}
                disabled={updating}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                <CheckCircle size={15} />
                {updating ? 'Saving...' : 'Mark as Paid'}
              </button>
            )}
            {invoice.status === 'draft' && (
              <button
                onClick={() => markAs('sent')}
                disabled={updating}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Send size={15} />Mark as Sent
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => markAs('overdue')}
                disabled={updating}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                <AlertCircle size={15} />Mark Overdue
              </button>
            )}
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
              <Download size={15} />Download PDF
            </button>
          </div>
        </div>

        {invoice.status === 'paid' && invoice.paid_at && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
            <p className="font-semibold text-green-800">Payment Received</p>
            <p className="text-xs text-green-600 mt-0.5">{format(new Date(invoice.paid_at), 'MMMM d, yyyy h:mm a')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
