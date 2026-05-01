import React, { useEffect, useState } from 'react'
import { matchesAPI } from '../services/api'
import { PageHeader, LoadingScreen, EmptyState } from '../components/UI'
import { Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'   // ✅ NEW

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [seasons, setSeasons] = useState([])
  const [season, setSeason] = useState('')
  const [team, setTeam] = useState('')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()   // ✅ NEW

  useEffect(() => {
    matchesAPI.seasons().then(r => setSeasons(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (season) params.season = parseInt(season)
    if (team) params.team = team

    matchesAPI.list(params)
      .then(r => setMatches(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [season, team])

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeader title="Matches" subtitle="IPL match history 2008–2024" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select className="input sm:w-40" value={season} onChange={e => setSeason(e.target.value)}>
          <option value="">All Seasons</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input
          className="input sm:w-64"
          placeholder="Filter by team..."
          value={team}
          onChange={e => setTeam(e.target.value)}
        />

        {(season || team) && (
          <button className="btn btn-ghost" onClick={() => { setSeason(''); setTeam('') }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : matches.length === 0 ? (
        <EmptyState icon={Trophy} title="No matches found" description="Try changing your filters" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
              {matches.length} matches
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Teams</th>
                  <th>Venue</th>
                  <th>Winner</th>
                  <th>MOM</th>
                </tr>
              </thead>

              <tbody>
                {matches.map((m, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer hover:bg-white/5 transition"   // ✅ optional hover
                    onClick={() =>
                      navigate(`/match/${m.id || m.match_id}`)
                    }   // ✅ CLICK NAVIGATION
                  >
                    <td><span className="badge badge-green">{m.season}</span></td>

                    <td className="text-white/80">
                      <span className="font-medium">{m.team1}</span>
                      <span className="text-white/30 mx-1">vs</span>
                      <span className="font-medium">{m.team2}</span>
                    </td>

                    <td className="text-white/40 text-xs max-w-[180px] truncate">
                      {m.venue}
                    </td>

                    <td>
                      {m.winner
                        ? <span className="text-green-500 font-medium">{m.winner}</span>
                        : <span className="text-white/25">—</span>
                      }
                    </td>

                    <td className="text-white/50 text-sm">
                      {m.player_of_match || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}