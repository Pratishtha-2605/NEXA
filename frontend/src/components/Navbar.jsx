
function Navbar() {
  return (
    <header
      style={{
        height: "80px",
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        color: "#1e293b",
      }}
    >
      <input
        type="text"
        placeholder="Search experiments..."
        style={{
          padding: "12px",
          width: "300px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
        }}
      />

      <div>
        <strong>Komal</strong>
        <p style={{ fontSize: "12px", color: "#64748b" }}>
          Researcher
        </p>
      </div>
    </header>
  );
}

export default Navbar;