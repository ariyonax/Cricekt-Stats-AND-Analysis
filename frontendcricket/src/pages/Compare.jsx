import React, { useState } from 'react'
import { playersAPI } from '../services/api'
import { PageHeader } from '../components/UI'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { GitCompare, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const normalize = (val, max) => max > 0 ? Math.round((val / max) * 100) : 0

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs space-y-1">
      <div className="text-white/50 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Compare() {
  const [p1Name, setP1Name] = useState('')
  const [p2Name, setP2Name] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCompare = async e => {
    e.preventDefault()
    if (!p1Name.trim() || !p2Name.trim()) return
    if (p1Name === p2Name) { toast.error('Select two different players'); return }
    setLoading(true)
    try {
      const { data } = await playersAPI.compare(p1Name, p2Name)
      setResult(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not compare players')
    } finally {
      setLoading(false)
    }
  }

  // Build radar data with normalized values
  const radarData = result ? result.radar.map(item => {
    const p1v = item.player1 || 0
    const p2v = item.player2 || 0
    const maxVal = Math.max(p1v, p2v, 1)
    return {
      metric: item.metric.replace(/_/g, ' '),
      [result.player1.player_name]: normalize(p1v, maxVal),
      [result.player2.player_name]: normalize(p2v, maxVal),
      p1Raw: p1v,
      p2Raw: p2v,
    }
  }) : []

  // Bar chart data
  const barData = result ? [
    { label: 'Runs', p1: result.player1.total_runs || 0, p2: result.player2.total_runs || 0 },
    { label: 'Wickets', p1: result.player1.total_wickets || 0, p2: result.player2.total_wickets || 0 },
    { label: 'Matches', p1: result.player1.matches_played || 0, p2: result.player2.matches_played || 0 },
  ] : []

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeader
        title="Compare Players"
        subtitle="Head-to-head statistical comparison with radar and bar charts"
      />

      {/* Search form */}
      <div className="card p-5">
        <form onSubmit={handleCompare} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Player 1</label>
            <input className="input" placeholder="e.g. Virat Kohli" value={p1Name} onChange={e => setP1Name(e.target.value)} required />
          </div>
          <div className="hidden sm:flex items-center justify-center pb-1">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <GitCompare size={14} className="text-white/30" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Player 2</label>
            <input className="input" placeholder="e.g. MS Dhoni" value={p2Name} onChange={e => setP2Name(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary px-6" disabled={loading}>
            {loading
              ? <><div className="spinner" style={{width:16,height:16}} /> Comparing...</>
              : <><Zap size={14} /> Compare</>
            }
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-4 animate-[fadeUp_0.4s_ease-out]">
          {/* Player header comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[result.player1, result.player2].map((p, i) => (
              <div key={i} className={`card p-5 border ${i === 0 ? 'border-green-500/20' : 'border-blue-500/20'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-display flex-shrink-0 ${
                    i === 0 ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {p.player_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display tracking-wide text-white truncate">{p.player_name}</div>
                    <div className="text-xs text-white/40 truncate">{p.team}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-pitch-800 rounded-lg p-2">
                    <div className={`text-xl font-display ${i === 0 ? 'text-green-500' : 'text-blue-400'}`}>{p.total_runs?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-white/30 uppercase">Runs</div>
                  </div>
                  <div className="bg-pitch-800 rounded-lg p-2">
                    <div className={`text-xl font-display ${i === 0 ? 'text-green-500' : 'text-blue-400'}`}>{p.total_wickets || 0}</div>
                    <div className="text-[10px] text-white/30 uppercase">Wickets</div>
                  </div>
                  <div className="bg-pitch-800 rounded-lg p-2">
                    <div className="text-lg font-mono text-white">{p.batting_avg?.toFixed(1) || 0}</div>
                    <div className="text-[10px] text-white/30 uppercase">Bat Avg</div>
                  </div>
                  <div className="bg-pitch-800 rounded-lg p-2">
                    <div className="text-lg font-mono text-white">{p.strike_rate?.toFixed(1) || 0}</div>
                    <div className="text-[10px] text-white/30 uppercase">Strike Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Radar */}
            <div className="card p-5">
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-4">Radar Comparison (Normalized)</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#666', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#444', fontSize: 9 }} />
                  <Radar name={result.player1.player_name} dataKey={result.player1.player_name}
                    stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={result.player2.player_name} dataKey={result.player2.player_name}
                    stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#666' }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar */}
            <div className="card p-5">
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-4">Head-to-Head Stats</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#666' }} />
                  <Bar dataKey="p1" name={result.player1.player_name} fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="p2" name={result.player2.player_name} fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed stat table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 text-xs text-white/40 uppercase tracking-widest font-semibold">
              Detailed Comparison
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="text-green-500">{result.player1.player_name}</th>
                    <th className="text-blue-400">{result.player2.player_name}</th>
                    <th>Better</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Runs',    p1: result.player1.total_runs,    p2: result.player2.total_runs,    higher: true },
                    { label: 'Total Wickets', p1: result.player1.total_wickets, p2: result.player2.total_wickets, higher: true },
                    { label: 'Batting Avg',   p1: result.player1.batting_avg,   p2: result.player2.batting_avg,   higher: true, dec: 1 },
                    { label: 'Strike Rate',   p1: result.player1.strike_rate,   p2: result.player2.strike_rate,   higher: true, dec: 1 },
                    { label: 'Economy',       p1: result.player1.economy,       p2: result.player2.economy,       higher: false, dec: 2 },
                    { label: 'Bowling Avg',   p1: result.player1.bowling_avg,   p2: result.player2.bowling_avg,   higher: false, dec: 1 },
                    { label: 'Matches Played',p1: result.player1.matches_played,p2: result.player2.matches_played,higher: true },
                  ].map(({ label, p1, p2, higher, dec }) => {
                    const v1 = p1 || 0; const v2 = p2 || 0
                    const p1Better = higher ? v1 > v2 : v1 < v2
                    const fmt = v => dec ? v?.toFixed(dec) ?? '0' : v?.toLocaleString() ?? 0
                    return (
                      <tr key={label}>
                        <td className="text-white/50">{label}</td>
                        <td className={`font-mono font-semibold ${p1Better ? 'text-green-500' : 'text-white/50'}`}>{fmt(v1)}</td>
                        <td className={`font-mono font-semibold ${!p1Better && v1 !== v2 ? 'text-blue-400' : 'text-white/50'}`}>{fmt(v2)}</td>
                        <td>
                          {v1 === v2
                            ? <span className="badge badge-amber">Tie</span>
                            : p1Better
                              ? <span className="badge badge-green text-xs">{result.player1.player_name?.split(' ').pop()}</span>
                              : <span className="badge badge-blue text-xs">{result.player2.player_name?.split(' ').pop()}</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
