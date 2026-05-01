import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Trophy, Brain, GitCompare,
  Upload, FileText, Radio, BarChart3, LogOut, X, Zap
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    roles: ['admin','analyst','fan'] },
  { to: '/players',     icon: Users,            label: 'Players',      roles: ['admin','analyst','fan'] },
  { to: '/matches',     icon: Trophy,           label: 'Matches',      roles: ['admin','analyst','fan'] },
  { to: '/predict',     icon: Brain,            label: 'Predict',      roles: ['admin','analyst','fan'] },
  { to: '/compare',     icon: GitCompare,       label: 'Compare',      roles: ['admin','analyst','fan'] },
  { to: '/live',        icon: Radio,            label: 'Live',         roles: ['admin','analyst','fan'], live: true },
  { to: '/upload',      icon: Upload,           label: 'Upload Data',  roles: ['admin','analyst'] },
  { to: '/reports',     icon: FileText,         label: 'Reports',      roles: ['admin','analyst'] },
  { to: '/ml-metrics',  icon: BarChart3,        label: 'ML Metrics',   roles: ['admin','analyst'] },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleColor = { admin: 'badge-red', analyst: 'badge-amber', fan: 'badge-green' }

  const filtered = navItems.filter(item => item.roles.some(r => hasRole(r)))

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        bg-pitch-900 border-r border-white/5
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap size={16} className="text-black" fill="black" />
            </div>
            <div>
              <div className="font-display text-xl tracking-widest text-white leading-none">STUMP</div>
              <div className="font-display text-xl tracking-widest text-green-500 leading-none">STATS</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 mx-3 mt-3 rounded-lg bg-pitch-800 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-500 font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.username}</div>
              <span className={`badge text-xs mt-0.5 ${roleColor[user?.role] || 'badge-green'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold tracking-widest text-white/25 px-3 mb-2 uppercase">Navigation</div>
          {filtered.map(({ to, icon: Icon, label, live }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon size={16} />
              <span className="font-medium">{label}</span>
              {live && <span className="live-dot ml-auto" />}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
