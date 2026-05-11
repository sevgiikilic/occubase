import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { logout, getSession } from '../utils/auth'
import { LayoutDashboard, BookOpen, ClipboardList, LogOut, Settings } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Genel Bakış',         icon: LayoutDashboard },
  { to: '/library',   label: 'Hastalık Kütüphanesi', icon: BookOpen },
  { to: '/assessment',label: 'Değerlendirme',         icon: ClipboardList },
  { to: '/settings',  label: 'Ayarlar',               icon: Settings },
]

export default function Layout() {
  const navigate = useNavigate()
  const session = getSession()

  return (
    <div className="flex min-h-screen" style={{ background: '#fbfaf7' }}>
      {/* Sidebar */}
      <aside className="sidebar w-60 bg-white flex flex-col no-print" style={{ borderRight: '1px solid #ece9e1' }}>
        {/* Logo */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #ece9e1' }}>
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.svg" alt="OccuBase" className="w-9 h-9" />
            <div>
              <div className="font-display font-bold text-ink-900 text-[15px] leading-tight" style={{ fontFamily: "'Inter Tight', Inter, sans-serif", color: '#0b1428' }}>
                OccuBase
              </div>
              <div className="text-[11px] font-medium" style={{ color: '#6b80a8' }}>İş Yeri Hekimliği</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-pulse-50 text-pulse-800 font-semibold'
                    : 'text-ink-500 hover:bg-[#f4f2ec] hover:text-ink-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2.5 py-3" style={{ borderTop: '1px solid #ece9e1' }}>
          <div className="px-3 py-1.5 mb-1">
            <div className="text-[11px] font-medium" style={{ color: '#6b80a8' }}>Oturum</div>
            <div className="text-[12px] font-semibold truncate" style={{ color: '#243450' }}>{session?.email}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{ color: '#4a5e85' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#4a5e85' }}
          >
            <LogOut size={16} />
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
