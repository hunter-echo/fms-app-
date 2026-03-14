'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getCatalogItems, updateCatalogItem } from '@/lib/data'
import type { CatalogItem } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['Service', 'Labor', 'Parts', 'Refrigerant', 'Diagnostic', 'Other']

export default function EditCatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', unit_price: '', category: 'Service' })

  useEffect(() => {
    getCatalogItems().then(items => {
      const item = items.find(i => i.id === id)
      if (item) setForm({ name: item.name, description: item.description || '', unit_price: item.unit_price.toString(), category: item.category })
      setLoading(false)
    })
  }, [id])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateCatalogItem(id, {
      name: form.name, description: form.description,
      unit_price: parseFloat(form.unit_price), category: form.category,
    })
    router.push('/pricebook')
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  if (loading) return <div className="p-6 dark:bg-gray-950 min-h-screen animate-pulse"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" /></div>

  return (
    <div className="p-6 max-w-xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/pricebook" className="text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Item</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item Name *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Unit Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" step="0.01" value={form.unit_price}
                  onChange={e => set('unit_price', e.target.value)} required
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
