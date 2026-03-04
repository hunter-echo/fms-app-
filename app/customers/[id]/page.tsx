'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getCustomers, getJobs, updateCustomer } from '@/lib/data'
import type { Customer, Job } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Phone, Mail, MapPin, ClipboardList, Plus, Edit2, Save } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({})

  useEffect(() => {
    Promise.all([getCustomers(), getJobs()]).then(([customers, allJobs]) => {
      const found = customers.find(c => c.id === id)
      setCustomer(found || null)
      setForm(found || {})
      setJobs(allJobs.filter(j => j.customer_id === id))
      setLoading(false)
    })
  }, [id])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const { name, phone, email, address, city, state, zip, notes } = form
    const success = await updateCustomer(id, { name, phone, email, address, city, state, zip, notes })
    if (success) {
      setCustomer(prev => prev ? { ...prev, ...form } : prev)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const totalSpend = jobs
    .filter(j => j.status === 'completed')
    .length

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Customer not found.</p>
        <Link href="/customers" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/customers" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{customer.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{totalSpend} completed job{totalSpend !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            editing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {editing ? <><Save size={14} />{saving ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} />Edit</>}
        </button>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ Customer updated
        </div>
      )}

      <div className="space-y-4">
        {/* Contact Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Contact Info</h2>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={form.name || ''} onChange={e => set('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input value={form.phone || ''} onChange={e => set('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input value={form.email || ''} onChange={e => set('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <input value={form.address || ''} onChange={e => set('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="City" value={form.city || ''} onChange={e => set('city', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="State" value={form.state || ''} onChange={e => set('state', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="ZIP" value={form.zip || ''} onChange={e => set('zip', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Phone size={15} className="text-gray-400" />{customer.phone}
              </a>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail size={15} className="text-gray-400" />{customer.email}
                </a>
              )}
              {customer.address && (
                <a
                  href={`https://maps.google.com?q=${encodeURIComponent(`${customer.address}, ${customer.city}, ${customer.state}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <MapPin size={15} className="text-gray-400" />
                  {customer.address}, {customer.city}, {customer.state} {customer.zip}
                </a>
              )}
              {customer.notes && (
                <div className="mt-2 text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  📝 {customer.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/jobs/new`}
            className="bg-blue-600 text-white rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors justify-center">
            <Plus size={16} />New Job
          </Link>
          <Link href={`/invoices/new`}
            className="bg-emerald-600 text-white rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 transition-colors justify-center">
            <ClipboardList size={16} />New Invoice
          </Link>
        </div>

        {/* Job History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Job History</h2>
            <span className="text-xs text-gray-400">{jobs.length} total</span>
          </div>
          {jobs.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No jobs yet</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {jobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {job.scheduled_date ? format(new Date(job.scheduled_date), 'MMM d, yyyy') : 'Not scheduled'}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
