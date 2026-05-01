import React from 'react'

export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      className={`spinner ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, sub, icon: Icon, color = 'green', trend }) {
  const colors = {
    green: 'text-green-500 bg-green-500/10',
    blue:  'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red:   'text-red-400 bg-red-500/10',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-2">{label}</div>
          <div className="text-2xl sm:text-3xl font-display tracking-wide text-white truncate">{value ?? '—'}</div>
          {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${colors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`text-xs mt-3 font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last season
        </div>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Icon size={24} className="text-white/20" />
        </div>
      )}
      <div className="text-white/40 font-medium mb-1">{title}</div>
      {description && <div className="text-sm text-white/25 max-w-xs">{description}</div>}
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={28} />
        <div className="text-sm text-white/30">Loading...</div>
      </div>
    </div>
  )
}

export function ErrorBanner({ message }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      {message}
    </div>
  )
}

export function WinProbBar({ team1, team2, p1, p2 }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-2">
        <span className="truncate mr-2">{team1}</span>
        <span className="truncate ml-2 text-right">{team2}</span>
      </div>
      <div className="h-6 rounded-full overflow-hidden flex bg-pitch-700">
        <div
          className="h-full bg-green-500 transition-all duration-1000 flex items-center pl-2"
          style={{ width: `${p1}%` }}
        >
          {p1 > 15 && <span className="text-xs font-bold text-black">{p1}%</span>}
        </div>
        <div
          className="h-full bg-blue-500 flex items-center justify-end pr-2 flex-1"
        >
          {p2 > 15 && <span className="text-xs font-bold text-white">{p2}%</span>}
        </div>
      </div>
    </div>
  )
}

export function ChartCard({ title, children, action }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-semibold text-white/70 uppercase tracking-widest">{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}
