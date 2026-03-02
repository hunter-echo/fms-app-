'use client'

import { Wind, Database, CreditCard, Map, Bell, Save } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 mt-2 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your Mountain Climate HVAC account</p>
      </div>

      <div className="space-y-5">
        {/* Company Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wind size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Company Info</h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  defaultValue="Mountain Climate HVAC"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  defaultValue="(720) 555-0000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
              <input
                type="text"
                placeholder="123 Main St, Denver, CO 80202"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                placeholder="HVAC-CO-XXXXX"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Integrations</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                name: 'Supabase',
                desc: 'Database & Authentication',
                icon: '🗄️',
                placeholder: 'NEXT_PUBLIC_SUPABASE_URL',
                connected: false,
              },
              {
                name: 'Stripe',
                desc: 'Payment Processing',
                icon: '💳',
                placeholder: 'sk_live_...',
                connected: false,
              },
              {
                name: 'Google Maps',
                desc: 'Job Navigation & Routing',
                icon: '🗺️',
                placeholder: 'AIzaSy...',
                connected: false,
              },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{integration.name}</p>
                    <p className="text-xs text-gray-500">{integration.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    integration.connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {integration.connected ? 'Connected' : 'Not configured'}
                  </span>
                  <button className="text-xs text-blue-600 hover:underline">Configure</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Defaults */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Invoice Defaults</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                defaultValue="8"
                step="0.1"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Invoice Notes</label>
            <textarea
              rows={2}
              defaultValue="Thank you for choosing Mountain Climate HVAC! Payment due upon receipt."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New job assigned to tech', defaultOn: true },
              { label: 'Job status updates', defaultOn: true },
              { label: 'Invoice paid', defaultOn: true },
              { label: 'Overdue invoice reminder', defaultOn: true },
              { label: 'Daily schedule summary (7 AM)', defaultOn: false },
            ].map((n) => (
              <label key={n.label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{n.label}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked={n.defaultOn} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
