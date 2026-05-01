import React, { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatCard, PageHeader, ChartCard, LoadingScreen } from '../components/UI'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Trophy, Users, Calendar, TrendingUp, Target, Award } from 'lucide-react'

const GREEN = '#22c55e'
const TEAM_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs space-y-1">
      <div className="text-white/50 mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-semibold">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats]         = useState(null)
  const [runs, setRuns]           = useState([])
  const [wickets, setWickets]     = useState([])
  const [winRates, setWinRates]   = useState([])
  const [batsmen, setBatsmen]     = useState([])
  const [bowlers, setBowlers]     = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      dashboardAPI.runsBySeason(),
      dashboardAPI.wicketsBySeason(),
      dashboardAPI.winRateByTeam(),
      dashboardAPI.topBatsmen(),
      dashboardAPI.topBowlers(),
    ]).then(([s, r, w, wr, b, bo]) => {
      setStats(s.data)
      setRuns(r.data)
      setWickets(w.data)
      setWinRates(wr.data.slice(0, 8))
      setBatsmen(b.data)
      setBowlers(bo.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><LoadingScreen /></div>

  // Merge runs + wickets by season
  const seasonData = runs.map(r => ({
    season: r.season,
    runs: r.runs,
    wickets: wickets.find(w => w.season === r.season)?.wickets || 0
  }))

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.username} • IPL Analytics Overview`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Matches" value={stats?.total_matches?.toLocaleString()} icon={Trophy} color="green" />
        <StatCard label="Total Players" value={stats?.total_players?.toLocaleString()} icon={Users} color="blue" />
        <StatCard label="IPL Seasons" value={stats?.total_seasons} icon={Calendar} color="amber" />
        <StatCard label="Most Titles" value={stats?.most_titles} icon={Award} color="red" sub="All time" />
      </div>

      {/* Top performers row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <Target size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Top Run Scorer</div>
            <div className="text-lg font-display tracking-wide text-white">{stats?.top_run_scorer}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Top Wicket Taker</div>
            <div className="text-lg font-display tracking-wide text-white">{stats?.top_wicket_taker}</div>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Runs & Wickets by Season">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={seasonData} barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="season" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
              <Bar yAxisId="left"  dataKey="runs"    fill={GREEN}   name="Runs"    radius={[3,3,0,0]} opacity={0.9} />
              <Bar yAxisId="right" dataKey="wickets" fill="#3b82f6" name="Wickets" radius={[3,3,0,0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Team Win Rates">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={winRates} layout="vertical" barSize={12}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="team" type="category" width={130} tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} formatter={v => [`${v}%`, 'Win Rate']} />
              <Bar dataKey="win_rate" name="Win Rate" radius={[0,3,3,0]}>
                {winRates.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? GREEN : `rgba(34,197,94,${0.7 - i * 0.07})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Batsmen */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">Top 10 Run Scorers</div>
          <div className="space-y-2">
            {batsmen.map((p, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={`w-6 text-center text-xs font-mono font-bold ${i === 0 ? 'text-amber-400' : 'text-white/25'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white/80 truncate">{p.player_name}</span>
                    <span className="text-sm font-mono font-bold text-green-500 ml-2">{p.total_runs?.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.total_runs / batsmen[0]?.total_runs) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bowlers */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">Top 10 Wicket Takers</div>
          <div className="space-y-2">
            {bowlers.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 text-center text-xs font-mono font-bold ${i === 0 ? 'text-amber-400' : 'text-white/25'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white/80 truncate">{p.player_name}</span>
                    <span className="text-sm font-mono font-bold text-blue-400 ml-2">{p.total_wickets} wkts</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.total_wickets / bowlers[0]?.total_wickets) * 100}%`, background: '#3b82f6' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
