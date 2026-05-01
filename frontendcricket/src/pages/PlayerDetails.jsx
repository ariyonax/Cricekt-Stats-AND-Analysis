import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { playersAPI } from "../services/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function PlayerDetails() {
  const { name } = useParams();

  const [player, setPlayer] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔹 Fetch all players
        const res = await playersAPI.list();
        const data = res.data?.data || res.data || [];

        const found = data.find(
          (p) => p.player_name === decodeURIComponent(name)
        );

        setPlayer(found);

        // 🔥 Fetch history
        const hist = await playersAPI.history(decodeURIComponent(name));
        console.log("HISTORY:", hist.data);

        setHistory(hist.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [name]);

  if (!player)
    return <p style={{ color: "white", padding: "20px" }}>Loading...</p>;

  return (
    <div style={{ color: "white", padding: "20px" }}>
      
      {/* 🔥 HEADER */}
      <div
        style={{
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "30px",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid rgba(0,255,255,0.2)",
          boxShadow: "0 0 25px rgba(0,255,255,0.15)",
        }}
      >
        <h1 style={{ fontSize: "32px", color: "#00ffff" }}>
          🏏 {player.player_name}
        </h1>
        <p style={{ opacity: 0.7 }}>
          Player Performance Overview
        </p>
      </div>

      {/* 🔥 STATS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard title="🏏 Matches" value={player.matches_played} />
        <StatCard title="🔥 Bat Avg" value={player.batting_avg} />
        <StatCard title="🎯 Bowl Avg" value={player.bowling_avg} />
        <StatCard title="⚡ Economy" value={player.economy} />
        <StatCard title="💯 Runs" value={player.runs || "N/A"} />
        <StatCard title="🚀 Strike Rate" value={player.strike_rate || "N/A"} />
      </div>

      {/* 🔥 CHART SECTION */}
      <div
        style={{
          padding: "20px",
          borderRadius: "16px",
          background: "#0f172a",
          border: "1px solid rgba(0,255,255,0.2)",
          boxShadow: "0 0 25px rgba(0,255,255,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#06b6d4" }}>
          📊 Performance Analytics
        </h3>

      <ResponsiveContainer width="100%" height={350}>
  <LineChart data={history.batting || []}>
    <CartesianGrid strokeDasharray="3 3" stroke="#333" />

    <XAxis dataKey="season" stroke="#aaa" />
    <YAxis stroke="#aaa" />
    <Tooltip />

    {/* 🔵 Runs */}
    <Line
      type="monotone"
      dataKey="runs"
      stroke="#00ffff"
      strokeWidth={2}
      dot={{ r: 3 }}
    />

    {/* 🟢 Bat Avg */}
    <Line
      type="monotone"
      dataKey="batting_avg"
      stroke="#22c55e"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
      </div>
    </div>
  );
}

// 🔥 STAT CARD COMPONENT
function StatCard({ title, value }) {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "14px",
        background: "#0f172a",
        border: "1px solid rgba(0,255,255,0.15)",
        textAlign: "center",
        transition: "0.3s",
        boxShadow: "0 0 15px rgba(0,255,255,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow =
          "0 0 20px rgba(0,255,255,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 0 15px rgba(0,255,255,0.05)";
      }}
    >
      <h3 style={{ marginBottom: "10px", color: "#06b6d4" }}>
        {title}
      </h3>
      <p style={{ fontSize: "20px", fontWeight: "bold" }}>
        {value}
      </p>
    </div>
  );
}

export default PlayerDetails;