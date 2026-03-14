'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getEstimate, updateEstimate } from '@/lib/data'
import type { Estimate } from '@/lib/types'
import { format } from 'date-fns'
import { CheckCircle, Wind, Phone, Mail } from 'lucide-react'

export default function EstimateCustomerViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    getEstimate(id).then(e => {
      setEstimate(e)
      if (e?.status === 'approved' || e?.status === 'converted') setApproved(true)
      setLoading(false)
    })
  }, [id])

  const handleApprove = async () => {
    if (!estimate) return
    setApproving(true)
    await updateEstimate(id, { status: 'approved', approved_at: new Date().toISOString() })
    setApproved(true)
    setEstimate(prev => prev ? { ...prev, status: 'approved', approved_at: new Date().toISOString() } : prev)
    setApproving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500 text-lg">Estimate not found.</p>
          <p className="text-gray-400 text-sm mt-2">Please contact Mountain Climate HVAC.</p>
        </div>
      </div>
    )
  }

  const customer = estimate.customer
  const isExpired = estimate.valid_until && new Date(estimate.valid_until) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Wind size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">Mountain Climate HVAC</div>
              <div className="text-blue-200 text-sm">Estimate {estimate.estimate_number}</div>
            </div>
          </div>
          {customer && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-xs mb-0.5">Prepared for</p>
              <p className="font-bold text-white text-xl">{customer.name}</p>
              {estimate.valid_until && (
                <p className={`text-sm mt-1 ${isExpired ? 'text-red-300' : 'text-blue-200'}`}>
                  {isExpired ? '⚠️ Expired' : `Valid until ${format(new Date(estimate.valid_until), 'MMMM d, yyyy')}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-4">
        {/* Approved banner */}
        {approved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-800 text-lg">Estimate Approved!</p>
            <p className="text-green-600 text-sm mt-1">Thank you! We&apos;ll be in touch shortly to schedule your service.</p>
          </div>
        )}

        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estimate Total</p>
              <p className="text-4xl font-bold text-gray-900">${estimate.total.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">Includes {(estimate.tax_rate * 100).toFixed(0)}% tax</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{format(new Date(estimate.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Scope of Work</h3>
          <div className="space-y-3">
            {estimate.line_items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.quantity} × ${item.unit_price?.toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-900 shrink-0">
                  ${(item.total || item.quantity * item.unit_price || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${estimate.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({(estimate.tax_rate * 100).toFixed(0)}%)</span>
              <span>${estimate.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-lg">
              <span>Total</span><span>${estimate.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{estimate.notes}</p>
          </div>
        )}

        {/* Approve Button */}
        {!approved && !isExpired && (
          <button onClick={handleApprove} disabled={approving}
            className="w-full bg-green-600 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg disabled:opacity-60">
            <CheckCircle size={22} />
            {approving ? 'Approving...' : 'Approve This Estimate ✓'}
          </button>
        )}

        {isExpired && !approved && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="font-semibold text-red-700">This estimate has expired</p>
            <p className="text-sm text-red-600 mt-1">Please contact us for an updated quote.</p>
          </div>
        )}

        {/* Contact */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wind size={16} className="text-blue-600" />
            <span className="font-semibold text-blue-800">Mountain Climate HVAC</span>
          </div>
          <p className="text-xs text-blue-600 mb-3">Questions about this estimate? Reach out anytime.</p>
          <div className="flex gap-3">
            <a href="tel:+17205550001"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Phone size={14} />Call Us
            </a>
            <a href="mailto:hunterfrazier719@gmail.com"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
              <Mail size={14} />Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
