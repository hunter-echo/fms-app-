'use client'

import { MOCK_DATA } from '@/lib/supabase'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, MapPin, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  pending: 'border-l-yellow-400 bg-yellow-50',
  scheduled: 'border-l-blue-400 bg-blue-50',
  in_progress: 'border-l-purple-400 bg-purple-50',
  completed: 'border-l-green-400 bg-green-50',
  cancelled: 'border-l-gray-300 bg-gray-50',
}

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const jobs = MOCK_DATA.jobs
  const customers = MOCK_DATA.customers
  const technicians = MOCK_DATA.technicians

  const getJobsForDay = (date: Date) =>
    jobs
      .filter((j) => j.scheduled_date && isSameDay(parseISO(j.scheduled_date), date))
      .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))

  const today = new Date()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek((d) => addDays(d, -7))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentWeek((d) => addDays(d, 7))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <Link
            href="/jobs/new"
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Job
          </Link>
        </div>
      </div>

      {/* Technician Legend */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs text-gray-500 font-medium">Technicians:</span>
        {technicians.map((tech) => (
          <div key={tech.id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
            <span className="text-xs text-gray-600">{tech.name}</span>
          </div>
        ))}
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          const dayJobs = getJobsForDay(day)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <div key={day.toISOString()} className={`min-h-[200px] ${isWeekend ? 'opacity-60' : ''}`}>
              {/* Day header */}
              <div className={`text-center py-2 mb-2 rounded-lg ${isToday ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>{format(day, 'd')}</div>
              </div>

              {/* Jobs */}
              <div className="space-y-1.5">
                {dayJobs.length === 0 && (
                  <div className="text-center text-xs text-gray-300 py-4">—</div>
                )}
                {dayJobs.map((job) => {
                  const customer = customers.find((c) => c.id === job.customer_id)
                  const tech = technicians.find((t) => t.id === job.technician_id)
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className={`block border-l-4 rounded-r-lg p-2 text-xs cursor-pointer hover:shadow-sm transition-shadow ${statusColors[job.status]}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {job.scheduled_time && (
                          <span className="text-gray-500">{job.scheduled_time}</span>
                        )}
                        {job.priority === 'emergency' && (
                          <Zap size={10} className="text-red-500" />
                        )}
                      </div>
                      <div className="font-semibold text-gray-800 leading-tight">{job.title}</div>
                      {customer && <div className="text-gray-500 truncate mt-0.5">{customer.name.split(' ')[0]}</div>}
                      {tech && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tech.color }} />
                          <span className="text-gray-500">{tech.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unscheduled Jobs */}
      <div className="mt-8">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Unscheduled Jobs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs
            .filter((j) => !j.scheduled_date && (j.status as string) !== 'completed' && (j.status as string) !== 'cancelled')
            .map((job) => {
              const customer = customers.find((c) => c.id === job.customer_id)
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="bg-white border border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{customer?.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin size={10} />
                        {job.city}, {job.state}
                      </div>
                    </div>
                    <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      needs scheduling
                    </span>
                  </div>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
