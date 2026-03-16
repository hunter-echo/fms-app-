'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getEstimate, updateEstimate } from '@/lib/data'
import type { Estimate } from '@/lib/types'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Wind, Phone, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function EstimateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<'approved' | 'declined' | null>(null)
  const [done, setDone] = useState<'approved' | 'declined' | null>(null)

  useEffect(() => {
    getEstimate(id).then(e => {
      setEstimate(e)
      setLoading(false)
      // If already approved/declined, show the final state
      if (e && (e.status === 'approved' || e.status === 'declined')) {
        setDone(e.status as 'approved' | 'declined')
      }
    })
  }, [id])

  const handleDecision = async (decision: 'approved' | 'declined') => {
    if (!estimate || submitting) return
    setSubmitting(decision)
    const updates: Partial<Estimate> = { status: decision }
    if (decision === 'approved') updates.approved_at = new Date().toISOString()
    const ok = await updateEstimate(id, updates)
    if (ok) {
      setEstimate(prev => prev ? { ...prev, ...updates } : prev)
      setDone(decision)
    }
    setSubmitting(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading estimate…</p>
        </div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Estimate Not Found</h2>
          <p className="text-gray-500 text-sm">This estimate may have expired or been removed.</p>
          <p className="text-gray-400 text-sm mt-2">Call us: <a href="tel:+17205550100" className="text-blue-600 hover:underline">(720) 555-0100</a></p>
        </div>
      </div>
    )
  }

  const isExpired = estimate.valid_until && new Date(estimate.valid_until) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wind size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Mountain Climate HVAC</div>
            <div className="text-xs text-gray-500">Denver, CO · Licensed &amp; Insured</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Done state — approved */}
        {done === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-1">Estimate Approved!</h2>
            <p className="text-green-700 text-sm mb-4">
              Thank you! We&apos;ll be in touch shortly to confirm your appointment.
            </p>
            <a href="tel:+17205550100"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              <Phone size={15} />Call Us
            </a>
          </div>
        )}

        {/* Done state — declined */}
        {done === 'declined' && (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center">
            <XCircle size={40} className="text-gray-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-700 mb-1">Estimate Declined</h2>
            <p className="text-gray-500 text-sm mb-4">
              No problem at all. If you change your mind or have questions, we&apos;re here.
            </p>
            <a href="tel:+17205550100"
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              <Phone size={15} />Contact Us
            </a>
          </div>
        )}

        {/* Main estimate card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Estimate</p>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">{estimate.estimate_number}</h1>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${estimate.total.toFixed(2)}</div>
                <div className="text-blue-200 text-xs">Total</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Customer info */}
            {estimate.customer && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prepared For</p>
                <p className="font-semibold text-gray-900">{estimate.customer.name}</p>
                {estimate.customer.address && (
                  <p className="text-sm text-gray-500">{estimate.customer.address}, {estimate.customer.city}, {estimate.customer.state}</p>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Created</p>
                <p className="text-gray-700 font-medium">{format(new Date(estimate.created_at), 'MMM d, yyyy')}</p>
              </div>
              {estimate.valid_until && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Valid Until</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                    {format(new Date(estimate.valid_until), 'MMM d, yyyy')}
                    {isExpired && <span className="text-xs ml-1">(expired)</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Work &amp; Parts</h2>
          <div className="space-y-3">
            {(estimate.line_items || []).map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{item.description || 'Service'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.quantity} unit{item.quantity !== 1 ? 's' : ''} × ${item.unit_price?.toFixed(2)} each</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm shrink-0">
                  ${(item.total || item.quantity * item.unit_price || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>${estimate.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax ({(estimate.tax_rate * 100).toFixed(0)}%)</span>
              <span>${estimate.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total</span><span>${estimate.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h2 className="font-semibold text-blue-800 text-sm mb-2">Notes from Our Team</h2>
            <p className="text-sm text-blue-700">{estimate.notes}</p>
          </div>
        )}

        {/* Validity warning */}
        {isExpired && !done && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">This estimate has expired</p>
              <p className="text-xs text-amber-700 mt-0.5">Please contact us for an updated quote.</p>
            </div>
          </div>
        )}

        {/* CTA buttons — only show if not yet decided and not converted */}
        {!done && estimate.status !== 'converted' && !isExpired && estimate.status !== 'declined' && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleDecision('approved')}
              disabled={!!submitting}
              className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 text-white rounded-2xl text-base font-bold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm shadow-green-200"
            >
              <ThumbsUp size={18} />
              {submitting === 'approved' ? 'Submitting…' : 'Approve This Estimate'}
            </button>
            <button
              onClick={() => handleDecision('declined')}
              disabled={!!submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-gray-500 border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60"
            >
              <ThumbsDown size={15} />
              {submitting === 'declined' ? 'Submitting…' : 'Decline'}
            </button>
          </div>
        )}

        {/* Already converted */}
        {estimate.status === 'converted' && !done && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-center">
            <CheckCircle size={32} className="text-purple-500 mx-auto mb-2" />
            <p className="font-semibold text-purple-800">This estimate has been converted</p>
            <p className="text-xs text-purple-600 mt-1">Work is in progress!</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">Questions? Call us anytime.</p>
          <a href="tel:+17205550100" className="text-sm font-semibold text-blue-600 hover:underline">(720) 555-0100</a>
          <p className="text-xs text-gray-300 mt-3">Mountain Climate HVAC · Denver, CO · Licensed &amp; Insured</p>
        </div>
      </div>
    </div>
  )
}
