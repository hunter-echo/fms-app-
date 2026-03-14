'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getEstimate, updateEstimate, createInvoice } from '@/lib/data'
import type { Estimate } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, Copy, Eye } from 'lucide-react'
import Link from 'next/link'

const BASE_URL = 'https://fms-app-five.vercel.app'

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [saved, setSaved] = useState('')
  const [copied, setCopied] = useState(false)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    getEstimate(id).then(e => { setEstimate(e); setLoading(false) })
  }, [id])

  const update = async (updates: Partial<Estimate>, msg: string) => {
    setUpdating(true)
    await updateEstimate(id, updates)
    setEstimate(prev => prev ? { ...prev, ...updates } : prev)
    setSaved(msg)
    setTimeout(() => setSaved(''), 2500)
    setUpdating(false)
  }

  const handleSend = async () => {
    if (!estimate) return
    const viewUrl = `${BASE_URL}/estimates/view/${id}`
    const customer = estimate.customer
    const name = customer?.name ? `Hi ${customer.name.split(' ')[0]}!` : 'Hi!'
    const sms = `${name} Here's your estimate from Mountain Climate HVAC for $${estimate.total.toFixed(2)}. Review and approve here: ${viewUrl}`
    await update({ status: 'sent' }, '✓ Marked as sent')
    window.open(`sms:${customer?.phone || ''}?body=${encodeURIComponent(sms)}`)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${BASE_URL}/estimates/view/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const convertToInvoice = async () => {
    if (!estimate) return
    setConverting(true)
    const invoice = await createInvoice({
      customer_id: estimate.customer_id,
      job_id: estimate.job_id,
      status: 'draft',
      line_items: estimate.line_items,
      subtotal: estimate.subtotal,
      tax_rate: estimate.tax_rate,
      tax_amount: estimate.tax_amount,
      total: estimate.total,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: estimate.notes,
    })
    if (invoice) {
      await updateEstimate(id, { status: 'converted', converted_at: new Date().toISOString() })
      router.push(`/invoices/${invoice.id}`)
    }
    setConverting(false)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="p-6 text-center dark:bg-gray-950 min-h-screen">
        <p className="text-gray-500">Estimate not found.</p>
        <Link href="/estimates" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </div>
    )
  }

  const isEditable = estimate.status === 'draft'
  const isConverted = estimate.status === 'converted'

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/estimates" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{estimate.estimate_number}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[estimate.status]}`}>
              {estimate.status}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {format(new Date(estimate.created_at), 'MMMM d, yyyy')}
            {estimate.valid_until && ` · Valid until ${format(new Date(estimate.valid_until), 'MMM d')}`}
          </p>
        </div>
        <a href={`/estimates/view/${id}`} target="_blank"
          className="text-gray-400 hover:text-blue-600 transition-colors" title="Customer view">
          <Eye size={18} />
        </a>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl text-sm font-medium">{saved}</div>
      )}

      {/* Approved banner */}
      {estimate.status === 'approved' && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Customer Approved!</p>
          </div>
          {estimate.approved_at && (
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Approved {format(new Date(estimate.approved_at), 'MMM d, h:mm a')}
            </p>
          )}
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Convert to invoice to collect payment, or start a job.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Customer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">ESTIMATE FOR</p>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{estimate.customer?.name}</p>
              {estimate.customer?.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{estimate.customer.phone}</p>}
              {estimate.customer?.address && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{estimate.customer.address}, {estimate.customer.city}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-red-400">${estimate.total.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total Estimate</p>
            </div>
          </div>
          {estimate.job && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400">Linked Job</p>
              <Link href={`/jobs/${estimate.job_id}`} className="text-sm text-blue-600 hover:underline font-medium">
                {estimate.job.job_number} — {estimate.job.title}
              </Link>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Scope of Work</h2>
          <div className="space-y-3">
            {estimate.line_items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
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

        {/* Actions */}
        {!isConverted && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Actions</h2>
            <div className="space-y-2">

              {/* Send to customer */}
              {(estimate.status === 'draft' || estimate.status === 'sent') && (
                <button onClick={handleSend} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
                  <Send size={15} />
                  {estimate.status === 'sent' ? 'Resend to Customer' : 'Send to Customer'}
                </button>
              )}

              {/* Copy link */}
              <button onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Copy size={15} />{copied ? 'Copied!' : 'Copy Estimate Link'}
              </button>

              {/* Approve manually */}
              {estimate.status !== 'approved' && estimate.status !== 'declined' && (
                <button onClick={() => update({ status: 'approved', approved_at: new Date().toISOString() }, '✓ Marked as approved')}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                  <CheckCircle size={15} />Mark as Approved
                </button>
              )}

              {/* Decline */}
              {!['approved', 'declined'].includes(estimate.status) && (
                <button onClick={() => update({ status: 'declined' }, '✓ Marked as declined')}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-60">
                  <XCircle size={15} />Mark as Declined
                </button>
              )}
            </div>
          </div>
        )}

        {/* Convert to Invoice */}
        {estimate.status === 'approved' && (
          <button onClick={convertToInvoice} disabled={converting}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-60">
            <FileText size={18} />
            {converting ? 'Converting...' : 'Convert to Invoice →'}
          </button>
        )}

        {/* Create job from estimate */}
        {estimate.status === 'approved' && (
          <Link href={`/jobs/new?customer=${estimate.customer_id}&estimate=${id}`}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors block text-center">
            + Create Job from Estimate
          </Link>
        )}

        {isConverted && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="text-purple-600 mx-auto mb-1" />
            <p className="font-semibold text-purple-800 dark:text-purple-300">Converted to Invoice</p>
            {estimate.converted_at && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                {format(new Date(estimate.converted_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
