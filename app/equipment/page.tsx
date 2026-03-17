'use client'

import { useEffect, useState } from 'react'
import { getEquipment } from '@/lib/data'
import type { Equipment } from '@/lib/types'
import { Plus, Wind, Thermometer, Flame, Droplets, Zap, Package, Search } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  furnace:      { label: 'Furnace',      icon: Flame,        color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  ac:           { label: 'A/C Unit',     icon: Wind,         color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  heat_pump:    { label: 'Heat Pump',    icon: Thermometer,  color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  boiler:       { label: 'Boiler',       icon: Droplets,     color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
  water_heater: { label: 'Water Heater', icon: Droplets,     color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  air_handler:  { label: 'Air Handler',  icon: Zap,          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  other:        { label: 'Other',        icon: Package,      color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getEquipment().then(e => { setEquipment(e); setLoading(false) })
  }, [])

  const filtered = equipment.filter(e => {
    const q = search.toLowerCase()
    return !q ||
      e.brand?.toLowerCase().includes(q) ||
      e.model?.toLowerCase().includes(q) ||
      e.serial_number?.toLowerCase().includes(q) ||
      e.customer?.name?.toLowerCase().includes(q) ||
      typeConfig[e.type]?.label.toLowerCase().includes(q)
  })

  const counts = equipment.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-3xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{equipment.length} units tracked</p>
        </div>
        <Link href="/equipment/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />Add Unit
        </Link>
      </div>

      {/* Type breakdown */}
      {!loading && equipment.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(counts).map(([type, count]) => {
            const cfg = typeConfig[type] || typeConfig.other
            const Icon = cfg.icon
            return (
              <div key={type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{count}</p>
                  <p className="text-xs text-gray-400">{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by brand, model, serial, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Wind size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{search ? 'No equipment matches your search' : 'No equipment tracked yet'}</p>
          {!search && (
            <Link href="/equipment/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
              + Add your first unit
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(eq => {
            const cfg = typeConfig[eq.type] || typeConfig.other
            const Icon = cfg.icon
            return (
              <Link key={eq.id} href={`/equipment/${eq.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {eq.brand} {eq.model}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0">{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {eq.customer?.name || 'Unknown customer'}
                      {eq.location && ` · ${eq.location}`}
                      {eq.serial_number && ` · S/N: ${eq.serial_number}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {eq.last_service_date ? (
                      <>
                        <p className="text-xs text-gray-400">Last service</p>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {format(new Date(eq.last_service_date), 'MMM d, yyyy')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-300 dark:text-gray-600">No service logged</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
