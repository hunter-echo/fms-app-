'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTechnicians, getTimeEntries, updateTimeEntry, deleteTimeEntry } from '@/lib/data'
import type { Technician, TimeEntry } from '@/lib/types'
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, differenceInMinutes, subWeeks } from 'date-fns'
import { ArrowLeft, CheckCircle2, Trash2, Edit2, Save, X, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function calcMinutes(entry: TimeEntry): number {
  if (!entry.clock_out) return differenceInMinutes(new Date(), new Date(entry.clock_in))
  return Math.max(0, differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in)) - (entry.break_minutes || 0))
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TimeCardsPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTech, setFilterTech] = useState('all')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = this week, -1 = last week, etc.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ clock_in: string; clock_out: string; break_minutes: string; notes: string }>({
    clock_in: '', clock_out: '', break_minutes: '0', notes: ''
  })
  const [saving, setSaving] = useState(false)

  const weekStart = startOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 })

  const load = useCallback(async () => {
    setLoading(true)
    const [techs, data] = await Promise.all([
      getTechnicians(),
      getTimeEntries({
        technician_id: filterTech !== 'all' ? filterTech : undefined,
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      })
    ])
    setTechnicians(techs)
    setEntries(data)
    setLoading(false)
  }, [filterTech, weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    await updateTimeEntry(id, { status: 'approved' })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return
    await deleteTimeEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id)
    setEditForm({
      clock_in: toLocalDatetimeValue(entry.clock_in),
      clock_out: entry.clock_out ? toLocalDatetimeValue(entry.clock_out) : '',
      break_minutes: String(entry.break_minutes || 0),
      notes: entry.notes || '',
    })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const updates: Partial<TimeEntry> = {
      clock_in: new Date(editForm.clock_in).toISOString(),
      clock_out: editForm.clock_out ? new Date(editForm.clock_out).toISOString() : undefined,
      break_minutes: parseInt(editForm.break_minutes) || 0,
      notes: editForm.notes || undefined,
    }
    const ok = await updateTimeEntry(id, updates)
    if (ok) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      setEditingId(null)
    }
    setSaving(false)
  }

  // Group entries by technician
  const techEntries = technicians
    .filter(t => filterTech === 'all' || t.id === filterTech)
    .map(tech => {
      const techEntries = entries.filter(e => e.technician_id === tech.id)
      const totalMins = techEntries.reduce((sum, e) => sum + calcMinutes(e), 0)
      return { tech, entries: techEntries, totalMins }
    })
    .filter(({ entries }) => entries.length > 0 || filterTech !== 'all')

  // Total hours across all techs
  const grandTotal = entries.reduce((sum, e) => sum + calcMinutes(e), 0)

  const inputClass = 'px-2 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6 max-w-4xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2 md:mt-0">
        <Link href="/timeclock" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Time Cards</h1>
          <p className="text-gray-400 text-sm">Manager view · approve &amp; edit entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Week navigation */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : format(weekStart, 'MMM d')}
            <span className="text-gray-400 text-xs ml-1 hidden sm:inline">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
            </span>
          </span>
          <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset >= 0}
            className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Tech filter */}
        <select value={filterTech} onChange={e => setFilterTech(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Technicians</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {/* Grand total badge */}
        {grandTotal > 0 && (
          <div className="ml-auto flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-xl text-sm font-bold">
            <Clock size={14} />{formatDuration(grandTotal)} total
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-32 animate-pulse border border-gray-200 dark:border-gray-700" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No time entries for this period</p>
          <Link href="/timeclock" className="mt-2 inline-block text-blue-600 text-sm hover:underline">← Go to Time Clock</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {techEntries.map(({ tech, entries: techEnt, totalMins }) => (
            <div key={tech.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Tech header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tech.color || '#6366f1' }}>
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                    <p className="text-xs text-gray-400">{techEnt.length} shift{techEnt.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatDuration(totalMins)}</p>
                  <p className="text-xs text-gray-400">this period</p>
                </div>
              </div>

              {/* Entries */}
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {techEnt.map(entry => (
                  <div key={entry.id} className="px-5 py-4">
                    {editingId === entry.id ? (
                      /* Edit form */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Clock In</label>
                            <input type="datetime-local" value={editForm.clock_in}
                              onChange={e => setEditForm(f => ({ ...f, clock_in: e.target.value }))}
                              className={inputClass + ' w-full'} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Clock Out</label>
                            <input type="datetime-local" value={editForm.clock_out}
                              onChange={e => setEditForm(f => ({ ...f, clock_out: e.target.value }))}
                              className={inputClass + ' w-full'} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Break (min)</label>
                            <input type="number" min="0" value={editForm.break_minutes}
                              onChange={e => setEditForm(f => ({ ...f, break_minutes: e.target.value }))}
                              className={inputClass + ' w-full'} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Notes</label>
                            <input type="text" value={editForm.notes}
                              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                              className={inputClass + ' w-full'} />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <X size={12} />Cancel
                          </button>
                          <button onClick={() => saveEdit(entry.id)} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
                            <Save size={12} />{saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Entry view */
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                              {format(new Date(entry.clock_in), 'EEE MMM d · h:mm a')}
                              {' → '}
                              {entry.clock_out
                                ? format(new Date(entry.clock_out), 'h:mm a')
                                : <span className="text-green-500 font-medium">Now</span>}
                            </p>
                            {entry.status === 'approved' && (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} />Approved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {entry.break_minutes > 0 && (
                              <span className="text-xs text-gray-400">-{entry.break_minutes}m break</span>
                            )}
                            {entry.job && (
                              <span className="text-xs text-blue-500">{entry.job.job_number} — {entry.job.title}</span>
                            )}
                            {entry.notes && (
                              <span className="text-xs text-gray-400 italic">"{entry.notes}"</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-base font-bold text-gray-800 dark:text-white tabular-nums">
                            {formatDuration(calcMinutes(entry))}
                          </span>
                          <div className="flex gap-1">
                            {entry.status !== 'approved' && (
                              <button onClick={() => handleApprove(entry.id)} title="Approve"
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button onClick={() => startEdit(entry)} title="Edit"
                              className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => handleDelete(entry.id)} title="Delete"
                              className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Unapproved warning */}
              {techEnt.some(e => e.status === 'completed') && (
                <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {techEnt.filter(e => e.status === 'completed').length} entr{techEnt.filter(e => e.status === 'completed').length !== 1 ? 'ies' : 'y'} pending approval
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
