import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { logout, getSession } from '../utils/auth'
import {
  LayoutDashboard, BookOpen, ClipboardList, LogOut, Stethoscope, Settings,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { to: '/library', label: 'Hastalık Kütüphanesi', icon: BookOpen },
  { to: '/assessment', label: 'Değerlendirme', icon: ClipboardList },
  { to: '/settings', label: 'Ayarlar', icon: Settings },
]

export default function Layout() {
  const navigate = useNavigate()
  const session = getSession()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="sidebar w-64 bg-white border-r border-slate-200 flex flex-col no-print">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight">OccuBase</div>
              <div className="text-xs text-slate-500">İş Yeri Hekimliği</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-200">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-slate-500">Oturum</div>
            <div className="text-sm text-slate-700 font-medium truncate">{session?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
