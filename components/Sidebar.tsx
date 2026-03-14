'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, Calendar, FileText, Settings, Wind, LogOut, Sun, Moon, FileCheck2, FileSignature } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useTheme } from 'next-themes'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/sheets', label: 'Sheets', icon: FileCheck2 },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/estimates', label: 'Estimates', icon: FileSignature },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (pathname === '/login') return null

  return (
    <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Wind size={20} />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">Mountain Climate</div>
          <div className="text-gray-400 text-xs">HVAC Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-gray-700 pt-4 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut size={18} />Sign Out
        </button>
        <div className="px-3 pt-2">
          <div className="text-xs text-gray-500">Mountain Climate HVAC</div>
          <div className="text-xs text-gray-600">v1.0.0</div>
        </div>
      </div>
    </aside>
  )
}
