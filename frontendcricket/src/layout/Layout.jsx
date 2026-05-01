import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "20px", color: "white" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;