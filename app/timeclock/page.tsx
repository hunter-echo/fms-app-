'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTechnicians, getJobs, getActiveEntry, getTimeEntries, clockIn, clockOut } from '@/lib/data'
import type { Technician, Job, TimeEntry } from '@/lib/types'
import { format, differenceInMinutes, differenceInHours } from 'date-fns'
import { Clock, LogIn, LogOut, ChevronDown, Briefcase, AlignLeft, CheckCircle2, Users } from 'lucide-react'
import Link from 'next/link'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function calcMinutes(entry: TimeEntry, now = new Date()): number {
  const start = new Date(entry.clock_in)
  const end = entry.clock_out ? new Date(entry.clock_out) : now
  return Math.max(0, differenceInMinutes(end, start) - (entry.break_minutes || 0))
}

export default function TimeClockPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedTech, setSelectedTech] = useState<string>('')
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [now, setNow] = useState(new Date())

  // Clock in form
  const [selectedJob, setSelectedJob] = useState('')
  const [notes, setNotes] = useState('')
  const [breakMins, setBreakMins] = useState('0')
  const [showForm, setShowForm] = useState(false)

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    Promise.all([getTechnicians(), getJobs()]).then(([techs, j]) => {
      setTechnicians(techs)
      setJobs(j.filter(job => job.status !== 'completed' && job.status !== 'cancelled'))
      if (techs.length > 0) setSelectedTech(techs[0].id)
      setLoading(false)
    })
  }, [])

  const loadTechData = useCallback(async (techId: string) => {
    if (!techId) return
    const today = new Date()
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const [active, entries] = await Promise.all([
      getActiveEntry(techId),
      getTimeEntries({ technician_id: techId, from }),
    ])
    setActiveEntry(active)
    setTodayEntries(entries)
  }, [])

  useEffect(() => {
    if (selectedTech) loadTechData(selectedTech)
  }, [selectedTech, loadTechData])

  const handleClockIn = async () => {
    if (!selectedTech) return
    setWorking(true)
    const entry = await clockIn(selectedTech, selectedJob || undefined, notes || undefined)
    if (entry) {
      setActiveEntry(entry)
      setShowForm(false)
      setSelectedJob('')
      setNotes('')
      await loadTechData(selectedTech)
    }
    setWorking(false)
  }

  const handleClockOut = async () => {
    if (!activeEntry) return
    setWorking(true)
    const ok = await clockOut(activeEntry.id, parseInt(breakMins) || 0, notes || undefined)
    if (ok) {
      setActiveEntry(null)
      setNotes('')
      setBreakMins('0')
      await loadTechData(selectedTech)
    }
    setWorking(false)
  }

  const todayTotal = todayEntries.reduce((sum, e) => sum + calcMinutes(e, now), 0)
  const currentTech = technicians.find(t => t.id === selectedTech)
  const isClockedIn = !!activeEntry
  const liveMinutes = activeEntry ? calcMinutes(activeEntry, now) : 0

  if (loading) {
    return (
      <div className="p-6 max-w-lg mx-auto dark:bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Clock</h1>
          <p className="text-gray-400 text-sm">{format(now, 'EEEE, MMMM d · h:mm a')}</p>
        </div>
        <Link href="/timeclock/cards"
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Users size={14} />Cards
        </Link>
      </div>

      {/* Tech selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">Who are you?</label>
        <div className="relative">
          <select
            value={selectedTech}
            onChange={e => setSelectedTech(e.target.value)}
            className="w-full appearance-none px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          >
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Status card + big button */}
      <div className={`rounded-2xl border-2 p-6 mb-4 transition-colors ${
        isClockedIn
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        {isClockedIn ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 dark:text-green-400 text-sm font-semibold uppercase tracking-wide">Clocked In</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums">
              {formatDuration(liveMinutes)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Since {format(new Date(activeEntry!.clock_in), 'h:mm a')}
              {activeEntry?.job && <span className="ml-2 text-blue-600 dark:text-blue-400">· {activeEntry.job.title}</span>}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Not Clocked In</span>
            </div>
            <p className="text-gray-400 text-sm">Tap below to start your shift</p>
          </>
        )}

        {/* Today total */}
        {todayTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-400">Today total: </span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatDuration(todayTotal)}</span>
          </div>
        )}
      </div>

      {/* Clock in form (expanded) */}
      {!isClockedIn && showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Briefcase size={11} />Link to Job (optional)</label>
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No specific job</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><AlignLeft size={11} />Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Starting rooftop inspection"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      {/* Clock out form */}
      {isClockedIn && showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Break time (minutes)</label>
            <input type="number" min="0" value={breakMins} onChange={e => setBreakMins(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Finished install"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      {/* Main action button */}
      {isClockedIn ? (
        <div className="space-y-3">
          <button onClick={() => { setShowForm(!showForm) }}
            className="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {showForm ? 'Hide Options' : 'Add Break / Notes'}
          </button>
          <button onClick={handleClockOut} disabled={working}
            className="w-full py-5 bg-red-600 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-3 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-red-200 dark:shadow-none">
            <LogOut size={22} />{working ? 'Clocking Out...' : 'Clock Out'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setShowForm(!showForm)}
            className="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {showForm ? 'Hide Options' : 'Add Job / Notes'}
          </button>
          <button onClick={handleClockIn} disabled={working}
            className="w-full py-5 bg-green-600 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-3 hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-green-200 dark:shadow-none">
            <LogIn size={22} />{working ? 'Clocking In...' : 'Clock In'}
          </button>
        </div>
      )}

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Today's Shifts</h2>
          <div className="space-y-2">
            {todayEntries.map(entry => (
              <div key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(new Date(entry.clock_in), 'h:mm a')}
                    {' → '}
                    {entry.clock_out ? format(new Date(entry.clock_out), 'h:mm a') : <span className="text-green-500">Now</span>}
                  </p>
                  {entry.notes && <p className="text-xs text-gray-400 truncate">{entry.notes}</p>}
                  {entry.job && <p className="text-xs text-blue-500 truncate">{entry.job.title}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDuration(calcMinutes(entry, now))}</p>
                  {entry.break_minutes > 0 && <p className="text-xs text-gray-400">-{entry.break_minutes}m break</p>}
                  {entry.status === 'approved' && <CheckCircle2 size={14} className="text-green-500 ml-auto" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
