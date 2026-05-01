import { useEffect, useState } from "react";
import { playersAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

function Players() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await playersAPI.list();
        setPlayers(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading)
    return <p style={{ color: "white", padding: "20px" }}>Loading...</p>;

  return (
    <div style={{ padding: "20px", color: "white" }}>
      {/* 🔥 HEADER */}
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        🏏 Player Analytics
      </h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "12px",
          width: "100%",
          marginBottom: "30px",
          borderRadius: "10px",
          border: "none",
          outline: "none",
          background: "#1a1a1a",
          color: "white",
          fontSize: "15px",
          boxShadow: "0 0 10px rgba(0,255,255,0.1)",
        }}
      />

      {/* 🔥 GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {players
          .filter((p) =>
            p.player_name.toLowerCase().includes(search.toLowerCase())
          )
          .map((p, i) => (
            <div
              key={i}
              onClick={() =>
                navigate(`/player/${encodeURIComponent(p.player_name)}`)
              }
              style={{
                padding: "18px",
                borderRadius: "15px",
                background:
                  "linear-gradient(145deg, #0f0f0f, #1c1c1c)",
                border: "1px solid #222",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 0 10px rgba(0,0,0,0.5)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(0,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 0 10px rgba(0,0,0,0.5)";
              }}
            >
              {/* PLAYER NAME */}
              <h2 style={{ marginBottom: "10px", color: "#00ffff" }}>
                {p.player_name}
              </h2>

              {/* STATS */}
              <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <div>🏏 Matches: {p.matches_played}</div>
                <div>🔥 Bat Avg: {p.batting_avg}</div>
                <div>🎯 Bowl Avg: {p.bowling_avg}</div>
                <div>⚡ Economy: {p.economy}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Players;