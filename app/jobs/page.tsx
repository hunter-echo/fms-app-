'use client'

import { useEffect, useState } from 'react'
import { getJobs, getCustomers, getTechnicians } from '@/lib/data'
import type { Job, Customer, Technician } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, Search, MapPin, Zap } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([getJobs(), getCustomers(), getTechnicians()]).then(([j, c, t]) => {
      setJobs(j); setCustomers(c); setTechnicians(t); setLoading(false)
    })
  }, [])

  const getCustomer = (id?: string) => customers.find(c => c.id === id)
  const getTech = (id?: string) => technicians.find(t => t.id === id)

  const filtered = jobs.filter((j) => {
    const customer = getCustomer(j.customer_id)
    const matchSearch = search === '' ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = ['pending','scheduled','in_progress','completed'].reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{filtered.length} work orders</p>
        </div>
        <Link
          href="/jobs/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Job
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'pending', 'scheduled', 'in_progress', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.replace('_', ' ')}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${statusFilter === s ? 'bg-white/20' : 'bg-gray-100'}`}>
              {s === 'all' ? jobs.length : (statusCounts[s] || 0)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {search || statusFilter !== 'all' ? 'No jobs match your filters' : 'No jobs yet — create your first one!'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/jobs/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">+ New Job</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const customer = job.customer || getCustomer(job.customer_id)
            const tech = job.technician || getTech(job.technician_id)
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-gray-400">{job.job_number}</span>
                      {(job.priority as string) === 'emergency' && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <Zap size={10} /> EMERGENCY
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{customer?.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={11} />{job.city}, {job.state}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.scheduled_date && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(job.scheduled_date), 'MMM d')}
                        {job.scheduled_time && ` · ${job.scheduled_time}`}
                      </span>
                    )}
                    {tech && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tech.color }} />
                        {tech.name.split(' ')[0]}
                      </span>
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
