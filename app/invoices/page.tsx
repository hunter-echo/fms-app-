'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { format } from 'date-fns'
import { Plus, Search, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const customers = MOCK_DATA.customers
  const invoices = MOCK_DATA.invoices.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customer_id)
    const matchSearch =
      search === '' ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRevenue = MOCK_DATA.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const outstanding = MOCK_DATA.invoices.filter((i) => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const overdueCount = MOCK_DATA.invoices.filter((i) => i.status === 'overdue').length

  const stats = [
    { label: 'Collected', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'Total Invoices', value: MOCK_DATA.invoices.length, icon: CheckCircle2, color: 'bg-gray-600' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} invoices</p>
        </div>
        <Link
          href="/invoices/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`${s.color} p-2 rounded-lg`}>
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.map((inv) => {
          const customer = customers.find((c) => c.id === inv.customer_id)
          return (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-semibold text-gray-900">{inv.invoice_number}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{customer?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {inv.line_items.length} line item{inv.line_items.length !== 1 ? 's' : ''}
                    {' · '}
                    Due {format(new Date(inv.due_date), 'MMM d, yyyy')}
                    {inv.paid_at && ` · Paid ${format(new Date(inv.paid_at), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-gray-900">${inv.total.toFixed(2)}</p>
                  {inv.status === 'overdue' && (
                    <p className="text-xs text-red-500 font-medium mt-0.5">OVERDUE</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
