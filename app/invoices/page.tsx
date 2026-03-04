'use client'

import { useEffect, useState } from 'react'
import { getInvoices, getCustomers } from '@/lib/data'
import type { Invoice, Customer } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([getInvoices(), getCustomers()]).then(([inv, cust]) => {
      setInvoices(inv); setCustomers(cust); setLoading(false)
    })
  }, [])

  const getCustomer = (id?: string) => customers.find(c => c.id === id)

  const filtered = statusFilter === 'all' ? invoices : invoices.filter(i => i.status === statusFilter)
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const outstanding = invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  const stats = [
    { label: 'Collected', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'Total', value: invoices.length, icon: CheckCircle2, color: 'bg-gray-600' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{filtered.length} invoices</p>
        </div>
        <Link href="/invoices/new" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`${s.color} p-2 rounded-lg`}><Icon size={16} className="text-white" /></div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`font-bold text-gray-900 ${typeof s.value === 'string' && s.value.startsWith('$') ? 'dark:text-red-400' : 'dark:text-white'}`}>{s.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 text-sm">No invoices yet — create your first one!</p>
          <Link href="/invoices/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">+ New Invoice</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const customer = inv.customer || getCustomer(inv.customer_id)
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900">{inv.invoice_number}</span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusStyles[inv.status]}`}>{inv.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{customer?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Due {format(new Date(inv.due_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-gray-900 dark:text-red-400">${inv.total.toFixed(2)}</p>
                    {inv.status === 'overdue' && <p className="text-xs text-red-500 font-medium mt-0.5">OVERDUE</p>}
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
