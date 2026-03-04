'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getSheetTemplates, createJobSheet, getJob } from '@/lib/data'
import type { SheetTemplate, Job } from '@/lib/types'
import { ArrowLeft, FileCheck2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function StartSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [job, setJob] = useState<Job | null>(null)
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    Promise.all([getSheetTemplates(), getJob(id)]).then(([t, j]) => {
      setTemplates(t)
      setJob(j)
      if (t.length > 0) setSelected(t[0].id)
      setLoading(false)
    })
  }, [id])

  const selectedTemplate = templates.find(t => t.id === selected)

  const handleStart = async () => {
    if (!selected || !selectedTemplate) return
    setStarting(true)
    const sheet = await createJobSheet({
      job_id: id,
      template_id: selected,
      template_name: selectedTemplate.name,
      responses: {},
      photos: [],
      status: 'in_progress',
    })
    if (sheet) {
      router.push(`/jobs/${id}/sheets/${sheet.id}`)
    } else {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto dark:bg-gray-950 min-h-screen animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-2 mt-2 md:mt-0">
        <Link href={`/jobs/${id}`} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Start Sheet</h1>
          {job && <p className="text-sm text-gray-500 dark:text-gray-400">{job.title}</p>}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-8">Choose a template to fill out</p>

      {templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <FileCheck2 size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No templates available</p>
          <Link href="/sheets/new" className="mt-2 inline-block text-blue-600 text-sm hover:underline">+ Create a template</Link>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl border-2 p-5 transition-all ${
                selected === t.id
                  ? 'border-blue-600 shadow-sm shadow-blue-100 dark:shadow-none'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected === t.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selected === t.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{t.fields.length} fields</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <button
          onClick={handleStart}
          disabled={!selected || starting}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <FileCheck2 size={18} />
          {starting ? 'Starting...' : `Start ${selectedTemplate?.name || 'Sheet'}`}
        </button>
      )}
    </div>
  )
}
