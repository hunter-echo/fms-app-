'use client'

import { useEffect, useState } from 'react'
import { getCatalogItems, deleteCatalogItem } from '@/lib/data'
import type { CatalogItem } from '@/lib/types'
import { Plus, BookOpen, Edit, Trash2, Tag } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_COLORS: Record<string, string> = {
  Service: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Labor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Parts: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Refrigerant: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Diagnostic: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export default function PricebookPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    getCatalogItems().then(i => { setItems(i); setLoading(false) })
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    setDeleting(id)
    await deleteCatalogItem(id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]
  const filtered = categoryFilter === 'all' ? items : items.filter(i => i.category === categoryFilter)

  const totalValue = items.reduce((s, i) => s + i.unit_price, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Price Book</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{items.length} saved items</p>
        </div>
        <Link href="/pricebook/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />Add Item
        </Link>
      </div>

      {/* Category filters */}
      {categories.length > 2 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white border-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}>{cat}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No items yet</p>
          <Link href="/pricebook/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
            + Add your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                    {item.category}
                  </span>
                </div>
                {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
              </div>
              <p className="font-bold text-gray-900 dark:text-red-400 text-lg shrink-0">${item.unit_price.toFixed(2)}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/pricebook/${item.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Edit size={15} />
                </Link>
                <button onClick={() => handleDelete(item.id, item.name)} disabled={deleting === item.id}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <Tag size={16} className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{items.length} items</strong> saved — click the <strong>📋 Price Book</strong> button on any estimate or invoice to add them in one tap.
          </p>
        </div>
      )}
    </div>
  )
}
