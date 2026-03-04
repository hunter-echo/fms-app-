'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, FileCheck2, Users, FileText } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/sheets', label: 'Sheets', icon: FileCheck2 },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
]

export default function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/login') return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
