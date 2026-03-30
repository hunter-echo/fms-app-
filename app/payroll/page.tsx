'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTechnicians, updateTechnician, getTimeEntries } from '@/lib/data'
import type { Technician, TimeEntry } from '@/lib/types'
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks,
  differenceInMinutes, parseISO, startOfDay, endOfDay, eachDayOfInterval
} from 'date-fns'
import {
  ChevronLeft, ChevronRight, Download, Printer, DollarSign,
  Clock, Users, Edit2, Check, X
} from 'lucide-react'
import Link from 'next/link'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcEntryMinutes(entry: TimeEntry): number {
  if (!entry.clock_out) return 0 // exclude active entries from payroll
  return Math.max(0, differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in)) - (entry.break_minutes || 0))
}

function minutesToHours(m: number): number {
  return Math.round((m / 60) * 100) / 100
}

function formatHours(h: number): string {
  return h.toFixed(2) + 'h'
}

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Calculate regular + OT hours for a list of entries within one 7-day week.
 *  Colorado law: OT = hours > 40/week. Daily OT (>12h/day) omitted for simplicity. */
function calcWeekHours(entries: TimeEntry[]): { regular: number; overtime: number } {
  const totalMins = entries.reduce((s, e) => s + calcEntryMinutes(e), 0)
  const total = minutesToHours(totalMins)
  const regular = Math.min(total, 40)
  const overtime = Math.max(0, total - 40)
  return { regular, overtime }
}

type PeriodType = 'weekly' | 'biweekly'

interface TechPayRow {
  tech: Technician
  regularHours: number
  overtimeHours: number
  totalHours: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  grossPay: number
  entryCount: number
  pendingApproval: number
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: TechPayRow[], periodLabel: string) {
  const headers = ['Technician', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Hourly Rate', 'Regular Pay', 'Overtime Pay', 'Gross Pay']
  const lines = [
    [`Pay Period: ${periodLabel}`],
    [],
    headers,
    ...rows.map(r => [
      r.tech.name,
      r.regularHours.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.totalHours.toFixed(2),
      r.hourlyRate.toFixed(2),
      r.regularPay.toFixed(2),
      r.overtimePay.toFixed(2),
      r.grossPay.toFixed(2),
    ]),
    [],
    ['TOTALS', '', '', rows.reduce((s, r) => s + r.totalHours, 0).toFixed(2), '',
      rows.reduce((s, r) => s + r.regularPay, 0).toFixed(2),
      rows.reduce((s, r) => s + r.overtimePay, 0).toFixed(2),
      rows.reduce((s, r) => s + r.grossPay, 0).toFixed(2)],
  ]
  const csv = lines.map(l => l.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payroll-${periodLabel.replace(/\s/g, '-').replace(/[^a-z0-9-]/gi, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [periodType, setPeriodType] = useState<PeriodType>('biweekly')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current period

  // Hourly rate editing
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [rateInput, setRateInput] = useState('')
  const [savingRate, setSavingRate] = useState(false)

  // Period start: Monday of the appropriate week
  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const periodStart = startOfWeek(addWeeks(baseMonday, weekOffset * (periodType === 'biweekly' ? 2 : 1)), { weekStartsOn: 1 })
  const periodEnd = endOfWeek(
    addWeeks(periodStart, periodType === 'biweekly' ? 1 : 0),
    { weekStartsOn: 1 }
  )

  const periodLabel = periodType === 'biweekly'
    ? `${format(periodStart, 'MMM d')} – ${format(periodEnd, 'MMM d, yyyy')}`
    : `Week of ${format(periodStart, 'MMM d, yyyy')}`

  const load = useCallback(async () => {
    setLoading(true)
    const [techs, data] = await Promise.all([
      getTechnicians(),
      getTimeEntries({ from: periodStart.toISOString(), to: periodEnd.toISOString() })
    ])
    setTechnicians(techs)
    setEntries(data)
    setLoading(false)
  }, [weekOffset, periodType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleSaveRate = async (techId: string) => {
    const rate = parseFloat(rateInput)
    if (isNaN(rate) || rate < 0) return
    setSavingRate(true)
    const ok = await updateTechnician(techId, { hourly_rate: rate })
    if (ok) {
      setTechnicians(prev => prev.map(t => t.id === techId ? { ...t, hourly_rate: rate } : t))
    }
    setEditingRateId(null)
    setSavingRate(false)
  }

  // Build pay rows per tech
  const payRows: TechPayRow[] = technicians.map(tech => {
    const techEntries = entries.filter(e => e.technician_id === tech.id)
    const hourlyRate = tech.hourly_rate || 0

    let regularHours = 0
    let overtimeHours = 0

    if (periodType === 'weekly') {
      const { regular, overtime } = calcWeekHours(techEntries)
      regularHours = regular
      overtimeHours = overtime
    } else {
      // Bi-weekly: calc OT per week separately
      const week1End = endOfWeek(periodStart, { weekStartsOn: 1 })
      const w1Entries = techEntries.filter(e => parseISO(e.clock_in) <= week1End)
      const w2Entries = techEntries.filter(e => parseISO(e.clock_in) > week1End)
      const w1 = calcWeekHours(w1Entries)
      const w2 = calcWeekHours(w2Entries)
      regularHours = w1.regular + w2.regular
      overtimeHours = w1.overtime + w2.overtime
    }

    const totalHours = regularHours + overtimeHours
    const regularPay = regularHours * hourlyRate
    const overtimePay = overtimeHours * hourlyRate * 1.5
    const grossPay = regularPay + overtimePay

    return {
      tech,
      regularHours,
      overtimeHours,
      totalHours,
      hourlyRate,
      regularPay,
      overtimePay,
      grossPay,
      entryCount: techEntries.length,
      pendingApproval: techEntries.filter(e => e.status === 'completed').length,
    }
  }).filter(r => r.entryCount > 0 || r.tech.active)

  const grandRegular = payRows.reduce((s, r) => s + r.regularHours, 0)
  const grandOT = payRows.reduce((s, r) => s + r.overtimeHours, 0)
  const grandTotal = payRows.reduce((s, r) => s + r.totalHours, 0)
  const grandGross = payRows.reduce((s, r) => s + r.grossPay, 0)
  const totalPending = payRows.reduce((s, r) => s + r.pendingApproval, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Hours & pay summary by period</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Printer size={14} />Print
          </button>
          <button onClick={() => exportCSV(payRows.filter(r => r.entryCount > 0), periodLabel)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Download size={14} />Export CSV
          </button>
        </div>
      </div>

      {/* Period controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Period type toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {(['weekly', 'biweekly'] as PeriodType[]).map(p => (
            <button key={p} onClick={() => { setPeriodType(p); setWeekOffset(0) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                periodType === p
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}>
              {p === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-0">
            {weekOffset === 0 ? (periodType === 'biweekly' ? 'This Period' : 'This Week') : periodLabel}
          </span>
          <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset >= 0}
            className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="hidden sm:block text-sm text-gray-400">{periodLabel}</div>
      </div>

      {/* Pending approval warning */}
      {totalPending > 0 && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⚠️ {totalPending} time entr{totalPending !== 1 ? 'ies' : 'y'} pending approval — approve before running payroll
          </p>
          <Link href="/timeclock/cards" className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 ml-3">
            Review →
          </Link>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Hours', value: formatHours(grandTotal), icon: Clock, color: 'text-blue-600' },
          { label: 'Regular', value: formatHours(grandRegular), icon: Clock, color: 'text-gray-600 dark:text-gray-400' },
          { label: 'Overtime', value: formatHours(grandOT), icon: Clock, color: grandOT > 0 ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400' },
          { label: 'Total Gross Pay', value: formatMoney(grandGross), icon: DollarSign, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-tech pay table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-24 animate-pulse border border-gray-200 dark:border-gray-700" />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-8 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            <div className="col-span-2">Technician</div>
            <div className="text-right">Reg hrs</div>
            <div className="text-right">OT hrs</div>
            <div className="text-right">Total</div>
            <div className="text-right">Rate/hr</div>
            <div className="text-right">OT Pay</div>
            <div className="text-right">Gross Pay</div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {payRows.filter(r => r.entryCount > 0).map(row => (
              <div key={row.tech.id} className="px-5 py-4">
                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: row.tech.color || '#6366f1' }}>
                        {row.tech.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.tech.name}</p>
                        <p className="text-xs text-gray-400">{row.entryCount} shifts</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">{formatMoney(row.grossPay)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                    <div>
                      <p className="text-xs text-gray-400">Regular</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatHours(row.regularHours)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Overtime</p>
                      <p className={`text-sm font-semibold ${row.overtimeHours > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {formatHours(row.overtimeHours)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Rate/hr</p>
                      {editingRateId === row.tech.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">$</span>
                          <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)}
                            className="w-14 text-xs px-1 py-0.5 border border-blue-400 rounded focus:outline-none text-center"
                            autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveRate(row.tech.id)} />
                          <button onClick={() => handleSaveRate(row.tech.id)} disabled={savingRate}
                            className="text-green-600"><Check size={12} /></button>
                          <button onClick={() => setEditingRateId(null)} className="text-gray-400"><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingRateId(row.tech.id); setRateInput(String(row.hourlyRate)) }}
                          className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1 mx-auto hover:text-blue-600 transition-colors">
                          {row.hourlyRate > 0 ? `$${row.hourlyRate.toFixed(2)}` : <span className="text-gray-300">Set rate</span>}
                          <Edit2 size={10} className="text-gray-300" />
                        </button>
                      )}
                    </div>
                  </div>
                  {row.pendingApproval > 0 && (
                    <p className="text-xs text-amber-600 mt-2">⚠️ {row.pendingApproval} shifts pending approval</p>
                  )}
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-8 gap-4 items-center">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: row.tech.color || '#6366f1' }}>
                      {row.tech.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.tech.name}</p>
                      <p className="text-xs text-gray-400">{row.entryCount} shift{row.entryCount !== 1 ? 's' : ''}
                        {row.pendingApproval > 0 && <span className="text-amber-500 ml-1">· {row.pendingApproval} pending</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatHours(row.regularHours)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${row.overtimeHours > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                      {formatHours(row.overtimeHours)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatHours(row.totalHours)}</span>
                  </div>
                  <div className="text-right">
                    {editingRateId === row.tech.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-gray-400">$</span>
                        <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)}
                          className="w-16 text-xs px-1 py-1 border border-blue-400 rounded focus:outline-none text-right dark:bg-gray-700"
                          autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveRate(row.tech.id)} />
                        <button onClick={() => handleSaveRate(row.tech.id)} disabled={savingRate}
                          className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                        <button onClick={() => setEditingRateId(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingRateId(row.tech.id); setRateInput(String(row.hourlyRate)) }}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1 ml-auto hover:text-blue-600 transition-colors group">
                        {row.hourlyRate > 0 ? `$${row.hourlyRate.toFixed(2)}` : <span className="text-gray-300 text-xs">Set rate</span>}
                        <Edit2 size={11} className="text-gray-200 group-hover:text-blue-400 transition-colors" />
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${row.overtimePay > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {row.overtimePay > 0 ? formatMoney(row.overtimePay) : '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-bold ${row.grossPay > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                      {row.grossPay > 0 ? formatMoney(row.grossPay) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {payRows.filter(r => r.entryCount > 0).length === 0 && (
              <div className="px-5 py-12 text-center">
                <Users size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hours logged this period</p>
                <Link href="/timeclock" className="text-blue-600 text-sm hover:underline mt-1 inline-block">← Go to Time Clock</Link>
              </div>
            )}

            {/* Totals row */}
            {payRows.some(r => r.entryCount > 0) && (
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-200 dark:border-gray-700">
                <div className="hidden sm:grid grid-cols-8 gap-4 items-center">
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Totals</p>
                  </div>
                  <div className="text-right text-sm font-bold text-gray-800 dark:text-gray-200">{formatHours(grandRegular)}</div>
                  <div className={`text-right text-sm font-bold ${grandOT > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatHours(grandOT)}</div>
                  <div className="text-right text-sm font-bold text-gray-900 dark:text-white">{formatHours(grandTotal)}</div>
                  <div />
                  <div />
                  <div className="text-right text-base font-bold text-green-600">{formatMoney(grandGross)}</div>
                </div>
                <div className="sm:hidden flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total Hours</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatHours(grandTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Gross Pay</p>
                    <p className="text-xl font-bold text-green-600">{formatMoney(grandGross)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OT note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Overtime calculated at 1.5× for hours over 40/week · Colorado labor law · Rates are editable per technician
      </p>
    </div>
  )
}
