'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSheetTemplate } from '@/lib/data'
import type { SheetField } from '@/lib/types'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'

const FIELD_TYPES = [
  { value: 'checkbox', label: '✅ Checkbox' },
  { value: 'select', label: '📋 Dropdown' },
  { value: 'number', label: '🔢 Number' },
  { value: 'text', label: '📝 Short Text' },
  { value: 'textarea', label: '📄 Long Text' },
]

export default function NewTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<(SheetField & { optionsRaw: string })[]>([
    { id: Date.now().toString(), type: 'checkbox', label: '', optionsRaw: '' },
  ])

  const addField = () => {
    setFields(prev => [...prev, { id: Date.now().toString(), type: 'checkbox', label: '', optionsRaw: '' }])
  }

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  const updateField = (id: string, key: string, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const cleanFields: SheetField[] = fields
      .filter(f => f.label.trim())
      .map(f => ({
        id: f.id,
        type: f.type,
        label: f.label,
        ...(f.type === 'select' && f.optionsRaw
          ? { options: f.optionsRaw.split(',').map(o => o.trim()).filter(Boolean) }
          : {}),
      }))
    const result = await createSheetTemplate({ name, description, fields: cleanFields })
    if (result) router.push('/sheets')
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/sheets" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Sheet Template</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Template Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Template Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Template Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mini-Split Tune-Up"
                required
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Fields</h2>
            <span className="text-xs text-gray-400">{fields.filter(f => f.label).length} fields</span>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="pt-2.5 text-gray-300 dark:text-gray-600 shrink-0">
                  <GripVertical size={16} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={e => updateField(field.id, 'label', e.target.value)}
                      placeholder={`Field ${idx + 1} label`}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={field.type}
                      onChange={e => updateField(field.id, 'type', e.target.value)}
                      className="px-2 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  {field.type === 'select' && (
                    <input
                      type="text"
                      value={field.optionsRaw}
                      onChange={e => updateField(field.id, 'optionsRaw', e.target.value)}
                      placeholder="Options: Good, Needs Service, Failed (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <button type="button" onClick={() => removeField(field.id)}
                  className="pt-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addField}
            className="mt-3 flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 font-medium">
            <Plus size={15} />Add Field
          </button>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </form>
    </div>
  )
}
