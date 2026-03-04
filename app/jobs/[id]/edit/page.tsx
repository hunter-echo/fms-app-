'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { getJob, getCustomers, getTechnicians, updateJob } from '@/lib/data'
import type { Customer, Technician, Job } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: '',
    technician_id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    estimated_duration: 60,
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    city: '',
    state: 'CO',
    zip: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([getJob(id), getCustomers(), getTechnicians()]).then(([job, c, t]) => {
      if (job) {
        setForm({
          customer_id: job.customer_id || '',
          technician_id: job.technician_id || '',
          title: job.title || '',
          description: job.description || '',
          priority: job.priority || 'medium',
          status: job.status || 'pending',
          estimated_duration: job.estimated_duration || 60,
          scheduled_date: job.scheduled_date || '',
          scheduled_time: job.scheduled_time || '',
          address: job.address || '',
          city: job.city || '',
          state: job.state || 'CO',
          zip: job.zip || '',
          notes: job.notes || '',
        })
      }
      setCustomers(c)
      setTechnicians(t)
      setLoading(false)
    })
  }, [id])

  const set = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const success = await updateJob(id, {
      ...form,
      technician_id: form.technician_id || undefined,
      scheduled_date: form.scheduled_date || undefined,
      scheduled_time: form.scheduled_time || undefined,
    } as Partial<Job>)
    if (success) {
      router.push(`/jobs/${id}`)
    } else {
      setError('Failed to save. Try again.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    setDeleting(true)
    const sb = getSupabase()
    if (sb) await sb.from('jobs').delete().eq('id', id)
    router.push('/jobs')
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href={`/jobs/${id}`} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Job</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Update job details & schedule</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        >
          <Trash2 size={14} />{deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Customer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Customer</h2>
          <select
            value={form.customer_id}
            onChange={e => set('customer_id', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Job Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">🚨 Emergency</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration</label>
              <select value={form.estimated_duration} onChange={e => set('estimated_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">📅 Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
            <select value={form.technician_id} onChange={e => set('technician_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Unassigned</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {form.scheduled_date && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <span>📅</span>
              <span>Scheduled: {new Date(form.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {form.scheduled_time && ` at ${form.scheduled_time}`}
                {form.technician_id && ` · ${technicians.find(t => t.id === form.technician_id)?.name}`}
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Service Address</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Street Address" value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-3 gap-3">
              <input type="text" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)}
                className="col-span-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="State" value={form.state} onChange={e => set('state', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="ZIP" value={form.zip} onChange={e => set('zip', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Internal Notes</h2>
          <textarea rows={3} placeholder="Gate code, pet on property, special instructions..."
            value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60">
          <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
