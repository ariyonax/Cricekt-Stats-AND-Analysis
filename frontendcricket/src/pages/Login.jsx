import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [tab, setTab]         = useState('login')
  const [form, setForm]       = useState({ username: '', email: '', password: '', role: 'fan' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register }   = useAuth()
  const navigate              = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ username: form.username, email: form.email, password: form.password, role: form.role })
      toast.success('Account created! Please log in.')
      setTab('login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pitch-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />
      {/* Green glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Zap size={20} className="text-black" fill="black" />
          </div>
          <div>
            <div className="font-display text-3xl tracking-widest text-white leading-none">STUMP<span className="text-green-500">STATS</span></div>
            <div className="text-xs text-white/30 tracking-widest">IPL CRICKET ANALYTICS</div>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex bg-pitch-800 rounded-lg p-1 mb-6">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  tab === t ? 'bg-green-500 text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Username</label>
                <input
                  className="input"
                  placeholder="your_username"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? <><div className="spinner" style={{width:16,height:16}} /> Signing in...</> : 'Sign In'}
              </button>

              {/* Demo credentials hint */}
              <div className="p-3 rounded-lg bg-pitch-800 border border-white/5 text-xs text-white/30 space-y-1">
                <div className="font-semibold text-white/50 mb-1">Demo credentials</div>
                <div>Admin: <span className="font-mono text-green-500/70">admin / admin123</span></div>
                <div>Fan: <span className="font-mono text-green-500/70">fan / fan123</span></div>
              </div>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Username</label>
                <input className="input" placeholder="choose_username" value={form.username} onChange={e => set('username', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="min 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Role</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="fan">Fan</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                {loading ? <><div className="spinner" style={{width:16,height:16}} /> Creating account...</> : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-4">
          Powered by IPL data 2008–2024 • AI predictions
        </p>
      </div>
    </div>
  )
}
