import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Players from "./pages/Players";
import Dashboard from "./pages/Dashboard";
import Predict from "./pages/Predict";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Live from "./pages/Live";
import Compare from "./pages/Compare";
import PlayerDetails from "./pages/PlayerDetails";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="players" element={<Players />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="predict" element={<Predict />} />
          <Route path="login" element={<Login />} />
          <Route path="matches" element={<Matches />} />
          <Route path="live" element={<Live />} />
          <Route path="compare" element={<Compare />} />
          <Route path="player/:name" element={<PlayerDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;