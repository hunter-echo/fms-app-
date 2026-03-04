import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mountain Climate HVAC',
  description: 'HVAC Field Service Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950`}>
        <ThemeProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <main className="flex-1 overflow-auto pb-20 md:pb-0 bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
