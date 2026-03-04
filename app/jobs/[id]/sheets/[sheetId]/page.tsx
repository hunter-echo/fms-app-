'use client'

import { useEffect, useState, useRef } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getJobSheetWithDetails, getSheetTemplate, updateJobSheet } from '@/lib/data'
import { getSupabase } from '@/lib/supabase'
import type { JobSheet, SheetTemplate, SheetField, Job, Customer } from '@/lib/types'
import { ArrowLeft, CheckCircle, Camera, X, Clock, Send, Eye, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const BASE_URL = 'https://fms-app-five.vercel.app'

type SheetWithDetails = JobSheet & { job?: Job & { customer?: Customer } }

export default function FillSheetPage({ params }: { params: Promise<{ id: string; sheetId: string }> }) {
  const { id: jobId, sheetId } = use(params)
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [sheet, setSheet] = useState<SheetWithDetails | null>(null)
  const [template, setTemplate] = useState<SheetTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [responses, setResponses] = useState<Record<string, string | boolean | number>>({})
  const [photoFiles, setPhotoFiles] = useState<{ dataUrl: string; file: File }[]>([])

  useEffect(() => {
    getJobSheetWithDetails(sheetId).then(async s => {
      if (s) {
        setSheet(s)
        setResponses(s.responses || {})
        const t = await getSheetTemplate(s.template_id || '')
        setTemplate(t)
      }
      setLoading(false)
    })
  }, [sheetId])

  const setField = (id: string, value: string | boolean | number) => {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setPhotoFiles(prev => [...prev, { dataUrl: ev.target?.result as string, file }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return sheet?.photos || []
    const sb = getSupabase()
    const uploaded: string[] = [...(sheet?.photos || [])]
    if (!sb) return [...uploaded, ...photoFiles.map(p => p.dataUrl)]
    for (const p of photoFiles) {
      try {
        const filename = `${sheetId}/${Date.now()}-${p.file.name}`
        const { data, error } = await sb.storage.from('sheet-photos').upload(filename, p.file, { upsert: true })
        if (!error && data) {
          const { data: urlData } = sb.storage.from('sheet-photos').getPublicUrl(data.path)
          uploaded.push(urlData.publicUrl)
        } else {
          uploaded.push(p.dataUrl)
        }
      } catch {
        uploaded.push(p.dataUrl)
      }
    }
    return uploaded
  }

  const handleSave = async () => {
    setSaving(true)
    const photos = await uploadPhotos()
    await updateJobSheet(sheetId, { responses, photos })
    setPhotoFiles([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleSubmitForReview = async () => {
    setSaving(true)
    const photos = await uploadPhotos()
    await updateJobSheet(sheetId, {
      responses,
      photos,
      status: 'pending_review',
      completed_at: new Date().toISOString(),
    })
    router.push(`/jobs/${jobId}`)
  }

  const handleApprove = async () => {
    setSaving(true)
    await updateJobSheet(sheetId, { status: 'approved' })
    setSheet(prev => prev ? { ...prev, status: 'approved' } : prev)
    setSaving(false)
  }

  const handleSendToCustomer = async () => {
    if (!sheet) return
    const customer = sheet.job?.customer
    const customerPhone = customer?.phone || ''
    const viewUrl = `${BASE_URL}/sheets/view/${sheetId}`
    const customerName = customer?.name ? `Hi ${customer.name.split(' ')[0]}!` : 'Hi!'
    const smsBody = `${customerName} Your service report from Mountain Climate HVAC is ready: ${viewUrl}`

    // Mark as sent
    setSaving(true)
    await updateJobSheet(sheetId, { status: 'sent', sent_at: new Date().toISOString() })
    setSheet(prev => prev ? { ...prev, status: 'sent' } : prev)
    setSaving(false)

    // Open SMS
    window.open(`sms:${customerPhone}?body=${encodeURIComponent(smsBody)}`)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto dark:bg-gray-950 min-h-screen animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!sheet || !template) {
    return (
      <div className="p-6 text-center dark:bg-gray-950 min-h-screen">
        <p className="text-gray-500">Sheet not found.</p>
        <Link href={`/jobs/${jobId}`} className="text-blue-600 text-sm hover:underline">← Back to Job</Link>
      </div>
    )
  }

  const isTechEditable = sheet.status === 'in_progress'
  const isPendingReview = sheet.status === 'pending_review'
  const isApproved = sheet.status === 'approved'
  const isSent = sheet.status === 'sent'
  const isReadOnly = !isTechEditable

  const statusBadge: Record<string, { label: string; cls: string }> = {
    in_progress: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    pending_review: { label: '⏳ Pending Review', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    approved: { label: '✓ Approved', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    sent: { label: '✉️ Sent to Customer', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  }
  const badge = statusBadge[sheet.status] || statusBadge.in_progress

  return (
    <div className="p-4 max-w-xl mx-auto dark:bg-gray-950 min-h-screen pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 mt-2 md:mt-0">
        <Link href={`/jobs/${jobId}`} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{template.name}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
            {sheet.job?.customer?.name && (
              <span className="text-xs text-gray-400">{sheet.job.customer.name}</span>
            )}
          </div>
        </div>
        {/* Public view link */}
        <a href={`/sheets/view/${sheetId}`} target="_blank"
          className="text-gray-400 hover:text-blue-600 transition-colors" title="Preview customer view">
          <Eye size={18} />
        </a>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ Saved
        </div>
      )}

      {/* Manager Review Banner */}
      {isPendingReview && (
        <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-orange-600" />
            <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Awaiting Manager Review</p>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Tech submitted this sheet. Review the findings below, then approve and send to customer.
          </p>
          {sheet.completed_at && (
            <p className="text-xs text-orange-500 mt-1">Submitted {format(new Date(sheet.completed_at), 'MMM d, h:mm a')}</p>
          )}
        </div>
      )}

      {isApproved && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} className="text-blue-600" />
            <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Approved — Ready to Send</p>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Tap &ldquo;Send to Customer&rdquo; below to text them a link to their service report.
          </p>
        </div>
      )}

      {isSent && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Sent to Customer ✉️</p>
          </div>
          {sheet.sent_at && (
            <p className="text-xs text-green-600 mt-1">{format(new Date(sheet.sent_at), 'MMM d, h:mm a')}</p>
          )}
        </div>
      )}

      {/* Fields — read only if not in_progress */}
      <div className="space-y-3">
        {template.fields.map(field => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={responses[field.id]}
            onChange={val => setField(field.id, val)}
            disabled={isReadOnly}
          />
        ))}
      </div>

      {/* Photos */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">📸 Photos</h2>
        {(sheet.photos.length > 0 || photoFiles.length > 0) && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {sheet.photos.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {photoFiles.map((p, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        {isTechEditable && (
          <>
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Camera size={18} />Add Photo
            </button>
          </>
        )}
        {isReadOnly && sheet.photos.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No photos attached</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-2 md:relative md:bg-transparent md:border-0 md:mt-4 md:p-0">

        {/* Tech: in progress */}
        {isTechEditable && (
          <>
            <button onClick={handleSubmitForReview} disabled={saving}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-60">
              <Send size={18} />
              {saving ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
          </>
        )}

        {/* Manager: pending review */}
        {isPendingReview && (
          <button onClick={handleApprove} disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60">
            <ThumbsUp size={18} />
            {saving ? 'Approving...' : 'Approve Sheet ✓'}
          </button>
        )}

        {/* Manager: approved — send to customer */}
        {isApproved && (
          <button onClick={handleSendToCustomer} disabled={saving}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-60">
            <Send size={18} />
            {saving ? 'Opening SMS...' : `Send to Customer${sheet.job?.customer?.name ? ` — ${sheet.job.customer.name.split(' ')[0]}` : ''}`}
          </button>
        )}

        {/* Sent — resend option */}
        {isSent && (
          <button onClick={handleSendToCustomer}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span className="flex items-center justify-center gap-2"><Send size={14} />Resend to Customer</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Field Renderer ────────────────────────────────────────────────────────

function FieldRenderer({
  field, value, onChange, disabled,
}: {
  field: SheetField
  value: string | boolean | number | undefined
  onChange: (v: string | boolean | number) => void
  disabled: boolean
}) {
  const base = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4'
  const label = <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</p>
  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60'

  if (field.type === 'checkbox') {
    const checked = value === true || value === 'true'
    return (
      <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
          checked ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        } disabled:opacity-60`}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          checked ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        }`}>
          {checked ? '✓' : '—'}
        </div>
      </button>
    )
  }

  if (field.type === 'select') {
    const options = field.options || []
    if (options.length <= 4) {
      return (
        <div className={base}>
          {label}
          <div className="flex flex-wrap gap-2">
            {options.map(opt => (
              <button key={opt} type="button" disabled={disabled} onClick={() => onChange(opt)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  value === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                } disabled:opacity-60`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )
    }
    return (
      <div className={base}>
        {label}
        <select value={(value as string) || ''} onChange={e => onChange(e.target.value)} disabled={disabled} className={inputClass}>
          <option value="">Select…</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div className={base}>
        {label}
        <input type="number" step="any"
          value={(value as number) ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          disabled={disabled} className={`${inputClass} text-right text-lg font-semibold`} placeholder="0" />
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className={base}>
        {label}
        <textarea rows={3} value={(value as string) || ''} onChange={e => onChange(e.target.value)}
          disabled={disabled} placeholder="Enter notes..." className={`${inputClass} resize-none`} />
      </div>
    )
  }

  return (
    <div className={base}>
      {label}
      <input type="text" value={(value as string) || ''} onChange={e => onChange(e.target.value)}
        disabled={disabled} className={inputClass} />
    </div>
  )
}
