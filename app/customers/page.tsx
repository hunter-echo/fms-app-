'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { Plus, Search, Phone, Mail, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function CustomersPage() {
  const [search, setSearch] = useState('')

  const customers = MOCK_DATA.customers.filter((c) =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  const getJobCount = (customerId: string) =>
    MOCK_DATA.jobs.filter((j) => j.customer_id === customerId).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} total</p>
        </div>
        <Link
          href="/customers/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Customer
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customers.map((customer) => {
          const jobCount = getJobCount(customer.id)
          return (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-400">{jobCount} job{jobCount !== 1 ? 's' : ''} on record</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{customer.address}, {customer.city}, {customer.state}</span>
                    </div>
                  </div>

                  {customer.notes && (
                    <p className="mt-2 text-xs text-gray-400 truncate">{customer.notes}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
