'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { getCustomers, getTechnicians, createJob } from '@/lib/data'
import type { Customer, Technician } from '@/lib/types'

export default function NewJobPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: '',
    technician_id: '',
    title: '',
    description: '',
    priority: 'medium',
    estimated_duration: 60,
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    city: 'Denver',
    state: 'CO',
    zip: '',
    notes: '',
    status: 'pending' as const,
  })

  useEffect(() => {
    Promise.all([getCustomers(), getTechnicians()]).then(([c, t]) => {
      setCustomers(c)
      setTechnicians(t)
    })
  }, [])

  const set = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Use customer address if no job address given
    const selectedCustomer = customers.find(c => c.id === form.customer_id)
    const jobData = {
      ...form,
      address: form.address || selectedCustomer?.address || '',
      city: form.city || selectedCustomer?.city || '',
      state: form.state || selectedCustomer?.state || 'CO',
      zip: form.zip || selectedCustomer?.zip || '',
      technician_id: form.technician_id || undefined,
      scheduled_date: form.scheduled_date || undefined,
      scheduled_time: form.scheduled_time || undefined,
    }

    const result = await createJob(jobData as any)
    if (result) {
      router.push('/jobs')
    } else {
      setError('Failed to save. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Job</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Create a new work order</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Customer</h2>
          <select
            required
            value={form.customer_id}
            onChange={e => set('customer_id', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.address}</option>
            ))}
          </select>
          <div className="mt-3 text-right">
            <Link href="/customers/new" className="text-blue-600 text-xs hover:underline">+ Add new customer</Link>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AC Tune-Up, Emergency Repair, New Installation"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe the work to be done..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">🚨 Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration</label>
                <select
                  value={form.estimated_duration}
                  onChange={e => set('estimated_duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4+ hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Scheduling</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={e => set('scheduled_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={e => set('scheduled_time', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician</label>
            <select
              value={form.technician_id}
              onChange={e => set('technician_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Service Address</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Street Address" value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-3 gap-3">
              <input type="text" placeholder="City" value={form.city}
                onChange={e => set('city', e.target.value)}
                className="col-span-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="State" value={form.state}
                onChange={e => set('state', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="ZIP" value={form.zip}
                onChange={e => set('zip', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Leave blank to use customer's address on file</p>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Internal Notes</h2>
          <textarea rows={3} placeholder="Gate code, pet on property, special instructions..."
            value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Creating Job...' : 'Create Job'}
        </button>
      </form>
    </div>
  )
}
