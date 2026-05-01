import React, { useEffect, useState, useRef } from 'react'
import { liveAPI } from '../services/api'
import { PageHeader, LoadingScreen } from '../components/UI'
import { Radio, RefreshCw, Clock, MapPin } from 'lucide-react'

function MatchCard({ match }) {
  const score = match.score || []
  const isLive = match.status?.toLowerCase().includes('live') || match.status?.toLowerCase().includes('progress')

  return (
    <div className={`card p-5 transition-all ${isLive ? 'border-green-500/30 shadow-green-500/5 shadow-lg' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive
            ? <span className="live-dot" />
            : <div className="w-2 h-2 rounded-full bg-white/20" />
          }
          <span className={`text-xs font-semibold ${isLive ? 'text-green-500' : 'text-white/30'}`}>
            {isLive ? 'LIVE' : 'RECENT'}
          </span>
        </div>
        <div className="text-xs text-white/25">{match.date}</div>
      </div>

      {/* Match name */}
      <div className="text-sm font-medium text-white mb-1 leading-snug">{match.name}</div>

      {/* Venue */}
      {match.venue && (
        <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
          <MapPin size={11} />
          {match.venue}
        </div>
      )}

      {/* Scores */}
      {score.length > 0 ? (
        <div className="space-y-2 mb-3">
          {score.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-pitch-800 rounded-lg px-3 py-2">
              <span className="text-xs text-white/50 truncate mr-2">{s.inning}</span>
              <span className="font-mono font-bold text-sm text-white flex-shrink-0">
                {s.r}/{s.w} <span className="text-white/30 font-normal text-xs">({s.o} ov)</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Status */}
      <div className={`text-sm font-medium ${isLive ? 'text-green-400' : 'text-white/50'}`}>
        {match.status}
      </div>
    </div>
  )
}

export default function Live() {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError]       = useState(null)
  const [useDemo, setUseDemo]   = useState(false)
  const intervalRef             = useRef(null)

  const fetchMatches = async (demo = useDemo) => {
    try {
      const fn = demo ? liveAPI.demo : liveAPI.ipl
      const { data } = await fn()
      const list = data.ipl_matches || data.live_matches || []
      setMatches(list)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      // If live fails, fall back to demo
      if (!demo) {
        try {
          const { data } = await liveAPI.demo()
          setMatches(data.live_matches || [])
          setLastUpdate(new Date())
          setUseDemo(true)
          setError('Using demo data — CricAPI unavailable')
        } catch { setError('Could not fetch live data') }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    // Poll every 30 seconds
    intervalRef.current = setInterval(() => fetchMatches(), 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const liveCount  = matches.filter(m => m.status?.toLowerCase().includes('live')).length
  const recentCount = matches.length - liveCount

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeader
        title="Live Matches"
        subtitle="Real-time IPL scores and match data"
        action={
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-white/25 hidden sm:block">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchMatches()}
              className="btn btn-ghost text-xs px-3 py-2"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-pitch-800 border border-white/5">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-sm font-medium text-white">{liveCount} Live</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-white/30" />
          <span className="text-sm text-white/40">{recentCount} Recent</span>
        </div>
        {useDemo && (
          <>
            <div className="h-4 w-px bg-white/10" />
            <span className="badge badge-amber">Demo Mode</span>
          </>
        )}
        <div className="ml-auto text-xs text-white/20">Auto-refreshes every 30s</div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <LoadingScreen />
      ) : matches.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Radio size={24} className="text-white/20" />
          </div>
          <div className="text-white/40 font-medium mb-1">No live matches right now</div>
          <div className="text-sm text-white/25 mb-4">Check back during IPL match times</div>
          <button onClick={() => { setUseDemo(true); fetchMatches(true) }} className="btn btn-ghost">
            Load Demo Data
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((m, i) => <MatchCard key={m.id || i} match={m} />)}
        </div>
      )}

      {/* Firebase note */}
      <div className="p-4 rounded-xl bg-pitch-800 border border-white/5 text-xs text-white/25 space-y-1">
        <div className="font-semibold text-white/40">Firebase Integration</div>
        <div>Configure VITE_FIREBASE_* environment variables to enable real-time Firebase sync. Add Firebase Realtime Database rules and push live score updates from your backend or a Cloud Function to <code className="font-mono text-white/40">/live-scores</code> path.</div>
      </div>
    </div>
  )
}
