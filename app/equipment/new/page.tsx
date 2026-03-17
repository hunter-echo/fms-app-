'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCustomers, createEquipment } from '@/lib/data'
import type { Customer, EquipmentType } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: 'furnace',      label: 'Furnace' },
  { value: 'ac',           label: 'A/C Unit' },
  { value: 'heat_pump',    label: 'Heat Pump' },
  { value: 'boiler',       label: 'Boiler' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'air_handler',  label: 'Air Handler' },
  { value: 'other',        label: 'Other' },
]

const COMMON_BRANDS = ['Carrier', 'Lennox', 'Trane', 'Rheem', 'York', 'Goodman', 'American Standard', 'Bryant', 'Heil', 'Payne', 'Other']

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function NewEquipmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCustomer = searchParams.get('customer_id') || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: prefillCustomer,
    type: 'furnace' as EquipmentType,
    brand: '',
    model: '',
    serial_number: '',
    install_date: '',
    last_service_date: '',
    warranty_expiry: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    getCustomers().then(setCustomers)
  }, [])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) { setError('Please select a customer'); return }
    if (!form.brand.trim()) { setError('Brand is required'); return }
    if (!form.model.trim()) { setError('Model is required'); return }
    setSaving(true)
    setError('')
    const result = await createEquipment({
      customer_id: form.customer_id,
      type: form.type,
      brand: form.brand.trim(),
      model: form.model.trim(),
      serial_number: form.serial_number.trim() || undefined,
      install_date: form.install_date || undefined,
      last_service_date: form.last_service_date || undefined,
      warranty_expiry: form.warranty_expiry || undefined,
      location: form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
    if (result) {
      if (prefillCustomer) {
        router.push(`/customers/${prefillCustomer}`)
      } else {
        router.push(`/equipment/${result.id}`)
      }
    } else {
      setError('Failed to save equipment. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/equipment" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Equipment</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Customer & Type</h2>
          <div>
            <label className={labelClass}>Customer *</label>
            <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className={inputClass} required>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Equipment Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => set('type', t.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                    form.type === t.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Unit details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Unit Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand *</label>
              <select value={form.brand} onChange={e => set('brand', e.target.value)} className={inputClass}>
                <option value="">Select brand...</option>
                {COMMON_BRANDS.map(b => <option key={b} value={b === 'Other' ? '' : b}>{b}</option>)}
              </select>
              {form.brand === '' && (
                <input type="text" placeholder="Or type brand name..." onChange={e => set('brand', e.target.value)}
                  className={`${inputClass} mt-2`} />
              )}
            </div>
            <div>
              <label className={labelClass}>Model *</label>
              <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
                placeholder="e.g. 58CVA080" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Serial Number</label>
              <input type="text" value={form.serial_number} onChange={e => set('serial_number', e.target.value)}
                placeholder="Serial #" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. Basement, Attic" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Install Date</label>
              <input type="date" value={form.install_date} onChange={e => set('install_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Service Date</label>
              <input type="date" value={form.last_service_date} onChange={e => set('last_service_date', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Warranty Expiry</label>
            <input type="date" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} placeholder="Any additional notes about this unit..."
            className={`${inputClass} resize-none`} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
          <Save size={16} />{saving ? 'Saving...' : 'Save Equipment'}
        </button>
      </form>
    </div>
  )
}

export default function NewEquipmentPage() {
  return <Suspense fallback={<div className="p-6 dark:bg-gray-950 min-h-screen" />}><NewEquipmentForm /></Suspense>
}
