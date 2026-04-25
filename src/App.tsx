import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import UploadPrescription from '@/pages/UploadPrescription'
import Medications from '@/pages/Medications'
import Diet from '@/pages/Diet'
import Contact from './pages/Contact'

const navItems = [
  { to: '/', icon: 'fa-solid fa-house', label: 'Dashboard' },
  { to: '/upload', icon: 'fa-solid fa-upload', label: 'Upload Prescription' },
  { to: '/medications', icon: 'fa-solid fa-pills', label: 'My Medications' },
  { to: '/diet', icon: 'fa-solid fa-bowl-food', label: 'Diet & Health' },
  { to: '/contact', icon: 'fa-solid fa-phone', label: 'Contact Doctor' },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload Prescription',
  '/medications': 'My Medications',
  '/diet': 'Diet & Health',
  '/contact': 'Contact Doctor',
}


function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageTitle = pageTitles[location.pathname] ?? 'MedTrack'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-30 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
      >
        <div className="px-5 py-5 border-b border-gray-200 flex items-center gap-2">
          <i className="fa-solid fa-kit-medical text-blue-600 text-lg" />
          <span className="text-xl font-bold text-blue-600 tracking-tight">MedTrack</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <i className={`${icon} w-4 text-center`} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fa-solid fa-bars text-lg" />
            </button>
            <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPrescription />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
