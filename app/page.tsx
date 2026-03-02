'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { format } from 'date-fns'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]
  const jobs = MOCK_DATA.jobs
  const invoices = MOCK_DATA.invoices
  const customers = MOCK_DATA.customers

  const todaysJobs = jobs.filter((j) => j.scheduled_date === today)
  const activeJobs = jobs.filter((j) => ['scheduled', 'in_progress', 'pending'].includes(j.status))
  const completedToday = jobs.filter((j) => j.status === 'completed' && j.scheduled_date === today)
  const pendingInvoices = invoices.filter((i) => ['sent', 'overdue'].includes(i.status))
  const revenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)

  const stats = [
    {
      label: "Today's Jobs",
      value: todaysJobs.length,
      icon: Calendar,
      color: 'blue',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-600',
    },
    {
      label: 'Active Jobs',
      value: activeJobs.length,
      icon: ClipboardList,
      color: 'purple',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-600',
    },
    {
      label: 'Completed Today',
      value: completedToday.length,
      icon: CheckCircle2,
      color: 'green',
      bg: 'bg-green-50',
      iconBg: 'bg-green-600',
    },
    {
      label: 'Unpaid Invoices',
      value: pendingInvoices.length,
      icon: AlertTriangle,
      color: 'orange',
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
    },
    {
      label: 'Revenue (MTD)',
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'green',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-600',
    },
    {
      label: 'Total Customers',
      value: customers.length,
      icon: Clock,
      color: 'slate',
      bg: 'bg-slate-50',
      iconBg: 'bg-slate-600',
    },
  ]

  const getCustomer = (id: string) => customers.find((c) => c.id === id)
  const getTech = (id?: string) => MOCK_DATA.technicians.find((t) => t.id === id)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 mt-2 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — Mountain Climate HVAC
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.iconBg} p-2 rounded-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Today's Jobs</h2>
            <Link href="/schedule" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todaysJobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No jobs scheduled today</div>
            ) : (
              todaysJobs.map((job) => {
                const customer = getCustomer(job.customer_id)
                const tech = getTech(job.technician_id)
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{job.job_number}</span>
                          {job.priority === 'emergency' && (
                            <span className="flex items-center gap-0.5 text-xs font-medium text-red-600">
                              <Zap size={10} /> EMERGENCY
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm mt-0.5 truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 truncate">{customer?.name}</p>
                        {tech && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: tech.color }}
                            />
                            {tech.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status]}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">{job.scheduled_time}</span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Invoices</h2>
            <Link href="/invoices" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => {
              const customer = getCustomer(inv.customer_id)
              const statusStyle: Record<string, string> = {
                draft: 'bg-gray-100 text-gray-600',
                sent: 'bg-blue-100 text-blue-700',
                paid: 'bg-green-100 text-green-700',
                overdue: 'bg-red-100 text-red-700',
              }
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="block px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500 truncate">{customer?.name}</p>
                      <p className="text-xs text-gray-400">Due {format(new Date(inv.due_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">${inv.total.toFixed(2)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[inv.status]}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/jobs/new', label: 'New Job', icon: ClipboardList, color: 'bg-blue-600' },
          { href: '/customers/new', label: 'New Customer', icon: Clock, color: 'bg-gray-700' },
          { href: '/invoices/new', label: 'New Invoice', icon: DollarSign, color: 'bg-emerald-600' },
          { href: '/schedule', label: 'View Schedule', icon: Calendar, color: 'bg-purple-600' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`${color} text-white rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
