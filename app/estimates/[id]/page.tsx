'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getEstimate, updateEstimate, convertEstimateToInvoice, convertEstimateToJob } from '@/lib/data'
import type { Estimate } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, ClipboardList, Copy, ExternalLink, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BASE_URL = 'https://fms-app-five.vercel.app'

const statusConfig: Record<string, { badge: string; label: string; dot: string }> = {
  draft:     { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',   label: 'Draft',     dot: 'bg-gray-400' },
  sent:      { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Sent',      dot: 'bg-blue-500' },
  approved:  { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Approved', dot: 'bg-green-500' },
  declined:  { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    label: 'Declined',  dot: 'bg-red-500' },
  converted: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Converted', dot: 'bg-purple-500' },
}

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [converting, setConverting] = useState<'invoice' | 'job' | null>(null)

  useEffect(() => {
    getEstimate(id).then(e => {
      setEstimate(e)
      setLoading(false)
    })
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const updateStatus = async (status: Estimate['status']) => {
    setUpdating(true)
    const updates: Partial<Estimate> = { status }
    if (status === 'approved') updates.approved_at = new Date().toISOString()
    const ok = await updateEstimate(id, updates)
    if (ok) {
      setEstimate(prev => prev ? { ...prev, ...updates } : prev)
      showToast(`Estimate marked as ${status}`)
    }
    setUpdating(false)
  }

  const handleCopyLink = () => {
    const url = `${BASE_URL}/estimates/view/${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendSMS = () => {
    if (!estimate) return
    const url = `${BASE_URL}/estimates/view/${id}`
    const customerName = estimate.customer?.name || 'there'
    const body = `Hi ${customerName}! Your estimate ${estimate.estimate_number} for $${estimate.total.toFixed(2)} from Mountain Climate HVAC is ready to review: ${url}`
    window.open(`sms:?body=${encodeURIComponent(body)}`)
    updateStatus('sent')
  }

  const handleConvertToInvoice = async () => {
    if (!estimate) return
    setConverting('invoice')
    const invoice = await convertEstimateToInvoice(estimate)
    if (invoice) {
      showToast('Converted to invoice!')
      setTimeout(() => router.push(`/invoices/${invoice.id}`), 1200)
    } else {
      showToast('Failed to convert. Try again.')
      setConverting(null)
    }
  }

  const handleConvertToJob = async () => {
    if (!estimate) return
    setConverting('job')
    const job = await convertEstimateToJob(estimate)
    if (job) {
      showToast('Converted to job!')
      setTimeout(() => router.push(`/jobs/${job.id}`), 1200)
    } else {
      showToast('Failed to convert. Try again.')
      setConverting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse space-y-4 dark:bg-gray-950 min-h-screen">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="p-6 text-center dark:bg-gray-950 min-h-screen">
        <p className="text-gray-500">Estimate not found.</p>
        <Link href="/estimates" className="text-blue-600 hover:underline text-sm">← Back to Estimates</Link>
      </div>
    )
  }

  const s = statusConfig[estimate.status] || statusConfig.draft

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/estimates" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{estimate.estimate_number}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.badge}`}>{s.label}</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Created {format(new Date(estimate.created_at), 'MMMM d, yyyy')}
            {estimate.valid_until && ` · Valid until ${format(new Date(estimate.valid_until), 'MMMM d, yyyy')}`}
          </p>
        </div>
      </div>

      {toast && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      <div className="space-y-4">
        {/* Estimate Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-lg">Mountain Climate HVAC</div>
              <div className="text-sm text-gray-500 mt-0.5">Denver, CO</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-red-400">${estimate.total.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Estimate Total</div>
            </div>
          </div>

          {estimate.customer && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Customer</p>
              <Link href={`/customers/${estimate.customer.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {estimate.customer.name}
              </Link>
              {estimate.customer.email && <p className="text-sm text-gray-500">{estimate.customer.email}</p>}
              {estimate.customer.phone && <p className="text-sm text-gray-500">{estimate.customer.phone}</p>}
              {estimate.customer.address && (
                <p className="text-sm text-gray-500">{estimate.customer.address}, {estimate.customer.city}, {estimate.customer.state}</p>
              )}
            </div>
          )}

          {estimate.job && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Linked Job</p>
              <Link href={`/jobs/${estimate.job.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {estimate.job.job_number} — {estimate.job.title}
              </Link>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Line Items</h2>
          <div className="space-y-3">
            {(estimate.line_items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.description || 'Service'}</p>
                  <p className="text-gray-400 text-xs">{item.quantity} × ${item.unit_price?.toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-red-400 shrink-0">
                  ${(item.total || item.quantity * item.unit_price || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span className="dark:text-red-400">${estimate.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Tax ({(estimate.tax_rate * 100).toFixed(0)}%)</span>
              <span className="dark:text-red-400">${estimate.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span><span className="dark:text-red-400">${estimate.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Notes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{estimate.notes}</p>
          </div>
        )}

        {/* Share Link */}
        {estimate.status !== 'draft' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">🔗 Customer Link</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono mb-3 break-all">
              {BASE_URL}/estimates/view/{id}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Copy size={14} />{copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a href={`${BASE_URL}/estimates/view/${id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ExternalLink size={14} />Preview
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        {estimate.status !== 'converted' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Send to customer */}
              {(estimate.status === 'draft' || estimate.status === 'sent') && (
                <button onClick={handleSendSMS} disabled={updating}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 col-span-2">
                  <Send size={15} />
                  {estimate.status === 'sent' ? 'Resend to Customer' : 'Send to Customer (SMS)'}
                </button>
              )}

              {/* Approve / Decline — for manager use */}
              {estimate.status === 'sent' && (
                <>
                  <button onClick={() => updateStatus('approved')} disabled={updating}
                    className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60">
                    <CheckCircle size={15} />Mark Approved
                  </button>
                  <button onClick={() => updateStatus('declined')} disabled={updating}
                    className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-60">
                    <XCircle size={15} />Mark Declined
                  </button>
                </>
              )}

              {/* Convert */}
              {estimate.status === 'approved' && (
                <>
                  <button onClick={handleConvertToInvoice} disabled={!!converting}
                    className="flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60">
                    <FileText size={15} />
                    {converting === 'invoice' ? 'Converting...' : 'Convert to Invoice'}
                  </button>
                  <button onClick={handleConvertToJob} disabled={!!converting}
                    className="flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-60">
                    <ClipboardList size={15} />
                    {converting === 'job' ? 'Converting...' : 'Convert to Job'}
                  </button>
                </>
              )}

              {/* Revert declined to draft */}
              {estimate.status === 'declined' && (
                <button onClick={() => updateStatus('draft')} disabled={updating}
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-60">
                  Revert to Draft &amp; Revise
                </button>
              )}
            </div>
          </div>
        )}

        {/* Converted badge */}
        {estimate.status === 'converted' && estimate.converted_at && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="font-semibold text-purple-800 dark:text-purple-300">Estimate Converted</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              {format(new Date(estimate.converted_at), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        )}

        {/* Approved timestamp */}
        {estimate.status === 'approved' && estimate.approved_at && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 justify-center">
            <Clock size={13} />
            Approved {format(new Date(estimate.approved_at), 'MMMM d, yyyy h:mm a')}
          </div>
        )}
      </div>
    </div>
  )
}
