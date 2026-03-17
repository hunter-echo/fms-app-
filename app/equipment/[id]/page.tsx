'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getEquipmentById, updateEquipment, deleteEquipment } from '@/lib/data'
import type { Equipment, EquipmentType } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Edit2, Save, Trash2, User, MapPin, Calendar, Shield, ClipboardList, Wind, Thermometer, Flame, Droplets, Zap, Package } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  furnace:      { label: 'Furnace',      icon: Flame,        color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  ac:           { label: 'A/C Unit',     icon: Wind,         color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  heat_pump:    { label: 'Heat Pump',    icon: Thermometer,  color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  boiler:       { label: 'Boiler',       icon: Droplets,     color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
  water_heater: { label: 'Water Heater', icon: Droplets,     color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
  air_handler:  { label: 'Air Handler',  icon: Zap,          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  other:        { label: 'Other',        icon: Package,      color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
}

const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: 'furnace', label: 'Furnace' },
  { value: 'ac', label: 'A/C Unit' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'boiler', label: 'Boiler' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'air_handler', label: 'Air Handler' },
  { value: 'other', label: 'Other' },
]

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-xs text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide'

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [eq, setEq] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Equipment>>({})

  useEffect(() => {
    getEquipmentById(id).then(e => {
      setEq(e)
      setForm(e || {})
      setLoading(false)
    })
  }, [id])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const { type, brand, model, serial_number, install_date, last_service_date, warranty_expiry, location, notes } = form
    const success = await updateEquipment(id, { type, brand, model, serial_number, install_date, last_service_date, warranty_expiry, location, notes })
    if (success) {
      setEq(prev => prev ? { ...prev, ...form } : prev)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this equipment record? This cannot be undone.')) return
    await deleteEquipment(id)
    router.push('/equipment')
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  if (!eq) {
    return (
      <div className="p-6 text-center dark:bg-gray-950 min-h-screen">
        <p className="text-gray-500">Equipment not found.</p>
        <Link href="/equipment" className="text-blue-600 hover:underline text-sm">← Back to Equipment</Link>
      </div>
    )
  }

  const cfg = typeConfig[eq.type] || typeConfig.other
  const Icon = cfg.icon

  const isWarrantyExpired = eq.warranty_expiry && new Date(eq.warranty_expiry) < new Date()

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/equipment" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{eq.brand} {eq.model}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{cfg.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Edit2 size={14} />Edit
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setForm(eq) }}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                <Save size={14} />{saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Unit card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.color}`}>
              <Icon size={22} />
            </div>
            <div>
              {editing ? (
                <select value={form.type || eq.type} onChange={e => set('type', e.target.value)} className={inputClass}>
                  {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              ) : (
                <>
                  <p className="font-bold text-gray-900 dark:text-white">{eq.brand} {eq.model}</p>
                  <p className="text-sm text-gray-500">{cfg.label}</p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>Brand</p>
              {editing ? (
                <input type="text" value={form.brand || ''} onChange={e => set('brand', e.target.value)} className={inputClass} placeholder="Brand" />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{eq.brand || '—'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}>Model</p>
              {editing ? (
                <input type="text" value={form.model || ''} onChange={e => set('model', e.target.value)} className={inputClass} placeholder="Model" />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{eq.model || '—'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}>Serial Number</p>
              {editing ? (
                <input type="text" value={form.serial_number || ''} onChange={e => set('serial_number', e.target.value)} className={inputClass} placeholder="Serial #" />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{eq.serial_number || '—'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}><MapPin size={10} className="inline mr-1" />Location</p>
              {editing ? (
                <input type="text" value={form.location || ''} onChange={e => set('location', e.target.value)} className={inputClass} placeholder="e.g. Basement" />
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{eq.location || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer */}
        {eq.customer && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className={labelClass}><User size={10} className="inline mr-1" />Customer</p>
            <Link href={`/customers/${eq.customer.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm">
              {eq.customer.name}
            </Link>
            {eq.customer.address && (
              <p className="text-xs text-gray-400 mt-0.5">{eq.customer.address}, {eq.customer.city}</p>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-4">Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}><Calendar size={10} className="inline mr-1" />Install Date</p>
              {editing ? (
                <input type="date" value={form.install_date || ''} onChange={e => set('install_date', e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {eq.install_date ? format(new Date(eq.install_date), 'MMM d, yyyy') : '—'}
                </p>
              )}
            </div>
            <div>
              <p className={labelClass}><Calendar size={10} className="inline mr-1" />Last Service</p>
              {editing ? (
                <input type="date" value={form.last_service_date || ''} onChange={e => set('last_service_date', e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {eq.last_service_date ? format(new Date(eq.last_service_date), 'MMM d, yyyy') : '—'}
                </p>
              )}
            </div>
            <div>
              <p className={labelClass}><Shield size={10} className="inline mr-1" />Warranty Expiry</p>
              {editing ? (
                <input type="date" value={form.warranty_expiry || ''} onChange={e => set('warranty_expiry', e.target.value)} className={inputClass} />
              ) : (
                <p className={`text-sm font-medium ${isWarrantyExpired ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {eq.warranty_expiry ? `${format(new Date(eq.warranty_expiry), 'MMM d, yyyy')}${isWarrantyExpired ? ' (expired)' : ''}` : '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Notes</h2>
          {editing ? (
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Notes about this unit..." className={`${inputClass} resize-none`} />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{eq.notes || 'No notes'}</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/jobs/new?customer_id=${eq.customer_id}&equipment_id=${id}`}
              className="flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
              <ClipboardList size={15} />Create Job
            </Link>
            <Link href={`/estimates/new?customer_id=${eq.customer_id}`}
              className="flex items-center justify-center gap-2 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
              <ClipboardList size={15} />New Estimate
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600">
          Added {format(new Date(eq.created_at), 'MMMM d, yyyy')}
        </p>
      </div>
    </div>
  )
}
