'use client'

import { useEffect, useState } from 'react'
import { getCatalogItems } from '@/lib/data'
import type { CatalogItem } from '@/lib/types'
import { X, Search, BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  onSelect: (item: CatalogItem) => void
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Service: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Labor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Parts: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Refrigerant: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Diagnostic: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export default function CatalogPicker({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    getCatalogItems().then(i => { setItems(i); setLoading(false) })
  }, [])

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]
  const filtered = items.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Price Book</h2>
            <span className="text-xs text-gray-400">{items.length} items</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricebook" className="text-xs text-blue-600 hover:underline" onClick={onClose}>
              Manage
            </Link>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {categories.length > 2 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white border-gray-900'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No items found</p>
              <Link href="/pricebook/new" onClick={onClose}
                className="mt-2 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline">
                <Plus size={13} />Add to price book
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(item => (
                <button key={item.id} onClick={() => { onSelect(item); onClose() }}
                  className="w-full text-left px-4 py-3.5 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-gray-900 dark:text-red-400">${item.unit_price.toFixed(2)}</span>
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={12} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
