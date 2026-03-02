'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { format } from 'date-fns'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  User,
  Camera,
  CheckCircle,
  Edit,
  Navigation,
  Zap,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { use, useState } from 'react'
import type { JobStatus } from '@/lib/types'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const job = MOCK_DATA.jobs.find((j) => j.id === id)
  const [status, setStatus] = useState<JobStatus>(job?.status || 'pending')
  const [notes, setNotes] = useState(job?.notes || '')
  const [saved, setSaved] = useState(false)

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Job not found.</p>
        <Link href="/jobs" className="text-blue-600 hover:underline text-sm">← Back to Jobs</Link>
      </div>
    )
  }

  const customer = MOCK_DATA.customers.find((c) => c.id === job.customer_id)
  const tech = MOCK_DATA.technicians.find((t) => t.id === job.technician_id)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const nextStatus: Record<string, JobStatus> = {
    pending: 'scheduled',
    scheduled: 'in_progress',
    in_progress: 'completed',
    completed: 'completed',
  }

  const nextStatusLabel: Record<string, string> = {
    pending: 'Mark as Scheduled',
    scheduled: 'Start Job',
    in_progress: 'Complete Job',
    completed: 'Job Completed ✓',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">{job.job_number}</span>
            {job.priority === 'emergency' && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <Zap size={10} /> EMERGENCY
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 truncate">{job.title}</h1>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[status]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ Changes saved
        </div>
      )}

      <div className="space-y-4">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Customer</h2>
          {customer ? (
            <div>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              <div className="mt-2 space-y-1.5">
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone size={14} />
                  {customer.phone}
                </a>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  {job.address}, {job.city}, {job.state} {job.zip}
                </div>
              </div>
              {customer.notes && (
                <div className="mt-3 text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  📝 {customer.notes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No customer linked</p>
          )}
        </div>

        {/* Job Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Details</h2>
          <div className="space-y-2">
            {job.description && (
              <p className="text-sm text-gray-700">{job.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-1">
              {job.scheduled_date && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400" />
                  {format(new Date(job.scheduled_date), 'MMM d, yyyy')}
                  {job.scheduled_time && ` at ${job.scheduled_time}`}
                </div>
              )}
              {job.estimated_duration && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400" />
                  Est. {job.estimated_duration >= 60
                    ? `${Math.floor(job.estimated_duration / 60)}h${job.estimated_duration % 60 ? ` ${job.estimated_duration % 60}m` : ''}`
                    : `${job.estimated_duration}m`}
                </div>
              )}
            </div>
            {tech && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <User size={14} className="text-gray-400" />
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
                {tech.name}
              </div>
            )}
          </div>
        </div>

        {/* Field Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Field Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://maps.google.com?q=${encodeURIComponent(`${job.address}, ${job.city}, ${job.state}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Navigation size={15} />
              Navigate
            </a>
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
              <Camera size={15} />
              Add Photos
            </button>
            <Link
              href="/invoices/new"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <FileText size={15} />
              Create Invoice
            </Link>
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
              <Edit size={15} />
              Edit Job
            </button>
          </div>
        </div>

        {/* Tech Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Field Notes</h2>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you find? What did you fix? Parts used, observations..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={handleSave}
            className="mt-2 w-full bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Save Notes
          </button>
        </div>

        {/* Status Update */}
        {status !== 'completed' && (
          <button
            onClick={() => {
              setStatus(nextStatus[status])
              handleSave()
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <CheckCircle size={18} />
            {nextStatusLabel[status]}
          </button>
        )}

        {status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
            <p className="font-semibold text-green-800">Job Complete!</p>
            <p className="text-xs text-green-600 mt-0.5">
              {job.completed_at ? format(new Date(job.completed_at), 'MMM d, yyyy h:mm a') : 'Marked complete'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
