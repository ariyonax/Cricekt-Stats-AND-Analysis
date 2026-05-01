import axios from 'axios'

// ✅ Use Vite proxy (no direct localhost URL)
const BASE = import.meta.env.VITE_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: BASE,
})

// 🔐 Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 🚨 Handle unauthorized (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── AUTH ─────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me:       ()     => api.get('/api/auth/me'),
  users:    ()     => api.get('/api/auth/users'),
}

// ── DASHBOARD ────────────────────────────────────────
export const dashboardAPI = {
  stats:           () => api.get('/api/dashboard/stats'),
  runsBySeason:    () => api.get('/api/dashboard/runs-by-season'),
  wicketsBySeason: () => api.get('/api/dashboard/wickets-by-season'),
  winRateByTeam:   () => api.get('/api/dashboard/win-rate-by-team'),
  topBatsmen:      () => api.get('/api/dashboard/top-batsmen'),
  topBowlers:      () => api.get('/api/dashboard/top-bowlers'),
}

// ── PLAYERS ──────────────────────────────────────────
export const playersAPI = {
  list:    (params) => api.get('/api/players/', { params }),
  history: (name)   => api.get(`/api/players/${encodeURIComponent(name)}/history`),
  compare: (p1, p2) => api.get('/api/players/compare', {
    params: { player1: p1, player2: p2 }
  }),
  teams:   ()       => api.get('/api/players/teams'),
}

// ── MATCHES ──────────────────────────────────────────
export const matchesAPI = {
  list:    (params) => api.get('/api/matches/', { params }),
  seasons: ()       => api.get('/api/matches/seasons'),
  get:     (id)     => api.get(`/api/matches/${id}`),
}

// ── PREDICTIONS (ML 🔥) ──────────────────────────────
export const predictionsAPI = {
  player: (data) => api.post('/api/predictions/player', data),
  match:  (data) => api.post('/api/predictions/match', data),
  teams:  ()     => api.get('/api/predictions/teams'),
}

// ── REPORTS ──────────────────────────────────────────
export const reportsAPI = {
  summary: () => api.get('/api/reports/summary', {
    responseType: 'blob'
  }),
}

// ── UPLOAD ───────────────────────────────────────────
export const uploadAPI = {
  matches: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/api/upload/matches', fd)
  },

  deliveries: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/api/upload/deliveries', fd)
  },

  status: () => api.get('/api/upload/status'),
}

// ── LIVE MATCHES ─────────────────────────────────────
export const liveAPI = {
  matches: ()   => api.get('/api/live/matches'),
  ipl:     ()   => api.get('/api/live/ipl'),
  match:   (id) => api.get(`/api/live/match/${id}`),
  demo:    ()   => api.get('/api/live/scores/demo'),
}

// ── ML CONTROL ───────────────────────────────────────
export const mlAPI = {
  metrics: () => api.get('/api/ml/metrics'),
  retrain: () => api.post('/api/ml/retrain'),
}

// Default export
export default api