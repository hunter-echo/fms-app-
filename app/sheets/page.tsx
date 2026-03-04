'use client'

import { useEffect, useState } from 'react'
import { getSheetTemplates, deleteSheetTemplate, getPendingReviewSheets } from '@/lib/data'
import type { SheetTemplate, JobSheet, Job, Customer } from '@/lib/types'
import { Plus, FileCheck2, Edit, Trash2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const DEFAULT_IDS = ['tpl-1', 'tpl-2', 'tpl-3']
type PendingSheet = JobSheet & { job?: Job & { customer?: Customer } }

export default function SheetsPage() {
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [pendingSheets, setPendingSheets] = useState<PendingSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSheetTemplates(), getPendingReviewSheets()]).then(([t, p]) => {
      setTemplates(t)
      setPendingSheets(p)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    await deleteSheetTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Sheets</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Templates and field reports</p>
        </div>
        <Link href="/sheets/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />New Template
        </Link>
      </div>

      {/* Pending Review — manager action required */}
      {!loading && pendingSheets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Needs Review</h2>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingSheets.length}</span>
          </div>
          <div className="space-y-2">
            {pendingSheets.map(s => (
              <Link key={s.id} href={`/jobs/${s.job_id}/sheets/${s.id}`}
                className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.template_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.job?.customer?.name || 'Unknown customer'}
                      {s.completed_at && ` · Submitted ${format(new Date(s.completed_at), 'MMM d, h:mm a')}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2.5 py-1 rounded-full">
                  Review →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      <div className="mb-3 flex items-center gap-2">
        <FileCheck2 size={15} className="text-gray-400" />
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Templates</h2>
        <span className="text-xs text-gray-400">{templates.length}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileCheck2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No templates yet</p>
          <Link href="/sheets/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">+ Create your first template</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const isDefault = DEFAULT_IDS.includes(t.id)
            const checkboxCount = t.fields.filter(f => f.type === 'checkbox').length
            return (
              <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                      {isDefault && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800">
                          Pre-loaded
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{t.fields.length} fields</span>
                      {checkboxCount > 0 && <span>{checkboxCount} checkpoints</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/sheets/${t.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <Edit size={13} />Edit
                    </Link>
                    <button onClick={() => handleDelete(t.id, t.name)} disabled={deleting === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
                      <Trash2 size={13} />{deleting === t.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.fields.slice(0, 6).map(f => (
                    <span key={f.id} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">{f.label}</span>
                  ))}
                  {t.fields.length > 6 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full">+{t.fields.length - 6} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">💡 Workflow</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Tech fills out sheet on site → submits for review → manager approves → sends report link to customer via SMS.
        </p>
      </div>
    </div>
  )
}
