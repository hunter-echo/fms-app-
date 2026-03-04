'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getJobSheetWithDetails, getSheetTemplate } from '@/lib/data'
import type { JobSheet, SheetTemplate, Job, Customer } from '@/lib/types'
import { CheckCircle, Wind } from 'lucide-react'
import { format } from 'date-fns'

type SheetWithDetails = JobSheet & { job?: Job & { customer?: Customer } }

export default function CustomerSheetViewPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = use(params)
  const [sheet, setSheet] = useState<SheetWithDetails | null>(null)
  const [template, setTemplate] = useState<SheetTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobSheetWithDetails(sheetId).then(async s => {
      if (s) {
        setSheet(s)
        const t = await getSheetTemplate(s.template_id || '')
        setTemplate(t)
      }
      setLoading(false)
    })
  }, [sheetId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!sheet || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500 text-lg">Service report not found.</p>
          <p className="text-gray-400 text-sm mt-2">Please contact Mountain Climate HVAC for your report.</p>
        </div>
      </div>
    )
  }

  const customer = sheet.job?.customer
  const job = sheet.job

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
              <div className="text-blue-200 text-sm">Service Report</div>
            </div>
          </div>
          {customer && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-xs mb-0.5">Prepared for</p>
              <p className="font-bold text-white text-lg">{customer.name}</p>
              {customer.address && (
                <p className="text-blue-200 text-sm">{customer.address}, {customer.city}, {customer.state}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-4">
        {/* Report Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 text-lg mb-1">{template.name}</h2>
          {template.description && <p className="text-sm text-gray-500 mb-3">{template.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {sheet.completed_at && (
              <div>
                <span className="text-xs text-gray-400 block">Date of Service</span>
                <span className="font-medium">{format(new Date(sheet.completed_at), 'MMMM d, yyyy')}</span>
              </div>
            )}
            {job?.address && (
              <div>
                <span className="text-xs text-gray-400 block">Service Location</span>
                <span className="font-medium">{job.address}, {job.city}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Service Completed & Reviewed</span>
          </div>
        </div>

        {/* Field Results */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Inspection Results</h3>
          <div className="space-y-3">
            {template.fields.map(field => {
              const val = sheet.responses[field.id]
              if (val === undefined || val === null || val === '') return null

              if (field.type === 'checkbox') {
                const passed = val === true || val === 'true'
                return (
                  <div key={field.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{field.label}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {passed ? '✓ Pass' : '✗ Fail'}
                    </span>
                  </div>
                )
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.id} className="py-2 border-b border-gray-50 last:border-0">
                    <p className="text-xs font-medium text-gray-400 mb-1">{field.label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{String(val)}</p>
                  </div>
                )
              }

              return (
                <div key={field.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{field.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {field.type === 'number' ? `${val}` : String(val)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Photos */}
        {sheet.photos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {sheet.photos.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Service photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wind size={16} className="text-blue-600" />
            <span className="font-semibold text-blue-800">Mountain Climate HVAC</span>
          </div>
          <p className="text-xs text-blue-600">Thank you for choosing us for your HVAC service needs.</p>
          <p className="text-xs text-blue-500 mt-1">Questions? Call us anytime.</p>
        </div>
      </div>
    </div>
  )
}
