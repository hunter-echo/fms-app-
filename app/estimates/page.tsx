'use client'

import { useEffect, useState } from 'react'
import { getEstimates } from '@/lib/data'
import type { Estimate } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, FileSignature, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock size={12} />,
  sent: <Clock size={12} />,
  approved: <CheckCircle size={12} />,
  declined: <XCircle size={12} />,
  converted: <CheckCircle size={12} />,
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getEstimates().then(e => { setEstimates(e); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? estimates : estimates.filter(e => e.status === filter)
  const pendingValue = estimates.filter(e => ['sent', 'draft'].includes(e.status)).reduce((s, e) => s + e.total, 0)
  const approvedValue = estimates.filter(e => ['approved', 'converted'].includes(e.status)).reduce((s, e) => s + e.total, 0)
  const conversionRate = estimates.length > 0
    ? Math.round((estimates.filter(e => ['approved', 'converted'].includes(e.status)).length / estimates.length) * 100)
    : 0

  const stats = [
    { label: 'Pending', value: `$${pendingValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'bg-blue-500' },
    { label: 'Approved', value: `$${approvedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'bg-green-500' },
    { label: 'Close Rate', value: `${conversionRate}%`, color: 'bg-purple-500' },
    { label: 'Total', value: estimates.length, color: 'bg-gray-500' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{estimates.length} total</p>
        </div>
        <Link href="/estimates/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />New Estimate
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`font-bold text-gray-900 ${typeof s.value === 'string' && s.value.startsWith('$') ? 'dark:text-red-400' : 'dark:text-white'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'draft', 'sent', 'approved', 'declined', 'converted'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              filter === s ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white border-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileSignature size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No estimates yet</p>
          <Link href="/estimates/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">+ New Estimate</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => (
            <Link key={est.id} href={`/estimates/${est.id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{est.estimate_number}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[est.status]}`}>
                      {statusIcons[est.status]}{est.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{est.customer?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{format(new Date(est.created_at), 'MMM d, yyyy')}</span>
                    {est.valid_until && <span>Valid until {format(new Date(est.valid_until), 'MMM d')}</span>}
                    {est.status === 'approved' && est.approved_at && (
                      <span className="text-green-600 dark:text-green-400">Approved {format(new Date(est.approved_at), 'MMM d')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-gray-900 dark:text-red-400">${est.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{est.line_items.length} item{est.line_items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
