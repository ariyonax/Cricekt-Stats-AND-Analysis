function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>🏏 Welcome to Cricket Dashboard</h2>
      <p>
        This is your central hub.  
        Navigate using the sidebar or menu to explore:
      </p>

      <ul>
        <li>📊 Player Stats</li>
        <li>🏆 Team Stats</li>
        <li>📈 Predictions (ML)</li>
        <li>🔥 Live Matches</li>
      </ul>
    </div>
  );
}

export default Home;