
import Sidebar from "../components/Sidebar";

function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <main style={{ flex: 1, minWidth: 0, padding: "30px" }}>
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;