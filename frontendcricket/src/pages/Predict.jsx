import React, { useEffect, useState } from 'react'
import { predictionsAPI } from '../services/api'
import { PageHeader, WinProbBar } from '../components/UI'
import { Brain, TrendingUp, Target, Zap, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
const FORM_COLOR = { Excellent: 'badge-green', Good: 'badge-blue', Average: 'badge-amber', Poor: 'badge-red' }

export default function Predict() {
  const [tab, setTab]                 = useState('player')
  const [teams, setTeams]             = useState([])
  const [venues, setVenues]           = useState([])
  const [playerName, setPlayerName]   = useState('')
  const [playerResult, setPlayerResult] = useState(null)
  const [matchForm, setMatchForm]     = useState({ team1: '', team2: '', venue: '', toss_winner: '', toss_decision: 'bat' })
  const [matchResult, setMatchResult] = useState(null)
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    predictionsAPI.teams().then(r => {
      setTeams(r.data.teams || [])
      setVenues(r.data.venues || [])
    }).catch(() => {})
  }, [])

  const predictPlayer = async e => {
  e.preventDefault()

  if (!playerName.trim()) return

  setLoading(true)

  try {
    const { data } = await predictionsAPI.player({
      player_name: playerName   // ✅ ONLY THIS
    })

    console.log("RESPONSE:", data)

    setPlayerResult({
      ...data,
      player_name: playerName
    })

  } catch (err) {
    console.error("ERROR:", err.response?.data)

    alert(JSON.stringify(err.response?.data, null, 2))
  } finally {
    setLoading(false)
  }
}
  const predictMatch = async e => {
    e.preventDefault()
    if (!matchForm.team1 || !matchForm.team2 || !matchForm.venue) {
      toast.error('Please fill all fields')
      return
    }
    if (matchForm.team1 === matchForm.team2) { toast.error('Teams must be different'); return }
    setLoading(true)
    try {
      const payload = { ...matchForm, toss_winner: matchForm.toss_winner || matchForm.team1 }
      const { data } = await predictionsAPI.match(payload)
      setMatchResult(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const setMF = (k, v) => setMatchForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeader
        title="AI Predictions"
        subtitle="Machine learning powered predictions for player performance and match outcomes"
        action={<span className="badge badge-green"><Brain size={10} /> ML Powered</span>}
      />

      {/* Mode tabs */}
      <div className="flex bg-pitch-800 rounded-xl p-1 max-w-sm">
        {[
          { key: 'player', label: 'Player Prediction' },
          { key: 'match',  label: 'Match Outcome' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-green-500 text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* === Player Prediction === */}
        {tab === 'player' && (
          <>
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-widest">
                <Target size={14} className="text-green-500" /> Player Performance Prediction
              </div>

              <form onSubmit={predictPlayer} className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 tracking-widest uppercase mb-2 block">Player Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Virat Kohli"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    required
                  />
                  <div className="text-xs text-white/25 mt-1">Exact name from IPL dataset</div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading
                    ? <><div className="spinner" style={{width:16,height:16}} /> Predicting...</>
                    : <><Zap size={15} /> Predict Performance</>
                  }
                </button>
              </form>

              {/* Info */}
              <div className="rounded-xl bg-pitch-800 border border-white/5 p-4 text-xs text-white/30 space-y-1">
                <div className="font-semibold text-white/50 mb-2">How it works</div>
                <div>• Random Forest model trained on 2008–2024 IPL data</div>
                <div>• Features: batting avg, strike rate, matches played, economy</div>
                <div>• Predictions show expected performance in next match</div>
              </div>
            </div>

            {/* Player Result */}
            <div className="card p-6">
              {!playerResult ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Brain size={28} className="text-green-500/50" />
                  </div>
                  <div className="text-white/30">Prediction will appear here</div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center text-xl font-display text-green-500">
                      {playerResult.player_name?.[0]}
                    </div>
                    <div>
                      <div className="text-lg font-display tracking-wide text-white">{playerResult.player_name}</div>
                      <span className={`badge ${FORM_COLOR[playerResult.form_rating] || 'badge-green'}`}>
                        {playerResult.form_rating} Form
                      </span>
                    </div>
                  </div>

                  {/* Prediction numbers */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-pitch-800 rounded-xl p-4 text-center">
                      <div className="text-3xl font-display text-green-500">{playerResult.predicted_runs}</div>
                      <div className="text-xs text-white/30 uppercase tracking-widest mt-1">Pred. Runs</div>
                    </div>
                    <div className="bg-pitch-800 rounded-xl p-4 text-center">
                      <div className="text-3xl font-display text-blue-400">{playerResult.predicted_wickets}</div>
                      <div className="text-xs text-white/30 uppercase tracking-widest mt-1">Pred. Wkts</div>
                    </div>
                    <div className="bg-pitch-800 rounded-xl p-4 text-center">
                      <div className="text-3xl font-display text-amber-400">{playerResult.predicted_strike_rate}</div>
                      <div className="text-xs text-white/30 uppercase tracking-widest mt-1">Pred. SR</div>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white/40 uppercase tracking-widest">Model Confidence</span>
                      <span className="font-mono font-bold text-green-500">{Math.round(playerResult.confidence_score * 100)}%</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className="progress-fill" style={{ width: `${playerResult.confidence_score * 100}%` }} />
                    </div>
                  </div>

                  <div className="text-xs text-white/25 text-center">
                    Based on {playerResult.based_on_matches} IPL matches
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* === Match Prediction === */}
        {tab === 'match' && (
          <>
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-widest">
                <TrendingUp size={14} className="text-green-500" /> Match Outcome Prediction
              </div>

              <form onSubmit={predictMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Team 1</label>
                    <select className="input" value={matchForm.team1} onChange={e => setMF('team1', e.target.value)} required>
                      <option value="">Select team</option>
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Team 2</label>
                    <select className="input" value={matchForm.team2} onChange={e => setMF('team2', e.target.value)} required>
                      <option value="">Select team</option>
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Venue</label>
                  <select className="input" value={matchForm.venue} onChange={e => setMF('venue', e.target.value)} required>
                    <option value="">Select venue</option>
                    {venues.slice(0, 50).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Toss Winner</label>
                    <select className="input" value={matchForm.toss_winner} onChange={e => setMF('toss_winner', e.target.value)}>
                      <option value="">Select winner</option>
                      {[matchForm.team1, matchForm.team2].filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Toss Decision</label>
                    <select className="input" value={matchForm.toss_decision} onChange={e => setMF('toss_decision', e.target.value)}>
                      <option value="bat">Bat First</option>
                      <option value="field">Field First</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading
                    ? <><div className="spinner" style={{width:16,height:16}} /> Predicting...</>
                    : <><Zap size={15} /> Predict Winner</>
                  }
                </button>
              </form>
            </div>

            {/* Match Result */}
            <div className="card p-6">
              {!matchResult ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <TrendingUp size={28} className="text-blue-400/50" />
                  </div>
                  <div className="text-white/30">Match prediction will appear here</div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Winner badge */}
                  <div className="text-center p-5 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Predicted Winner</div>
                    <div className="text-2xl font-display tracking-wide text-green-500">{matchResult.predicted_winner}</div>
                    <div className="text-sm text-white/40 mt-1">
                      {Math.round(matchResult.confidence * 100)}% confidence
                    </div>
                  </div>

                  {/* Win probability bar */}
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Win Probability</div>
                    <WinProbBar
                      team1={matchResult.team1}
                      team2={matchResult.team2}
                      p1={matchResult.win_probability_team1}
                      p2={matchResult.win_probability_team2}
                    />
                  </div>

                  {/* Key factors */}
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Key Factors</div>
                    <div className="space-y-2">
                      {matchResult.key_factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
