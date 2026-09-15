const C = {
  primary: "#0F3D2E", accent: "#22C55E",
};

export default function Footer() {
  return (
    <footer style={{
      background: C.primary, padding: "48px 20px 28px", marginTop: 64,
      fontFamily: "'Poppins', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 32, marginBottom: 36
        }}>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <img
                src="https://res.cloudinary.com/dx2qaarhy/image/upload/v1789420327/2bb606dc-2292-40ba-a4e8-df6720a3b700.png"
                alt="Zoomo Eats"
                style={{ height: 32, width: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: "20px", maxWidth: 220 }}>
              Fastest food delivery platform with real-time tracking & exciting offers.
            </p>
          </div>

          <div>
            <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 14, letterSpacing: "0.02em" }}>Explore</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Restaurants", "/restaurants"], ["Offers", "#"], ["Support", "#"]].map(([label, href]) => (
                <li key={label}>
                  <a href={href} style={{
                    color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none",
                    transition: "color 120ms"
                  }}
                    onMouseEnter={e => e.target.style.color = "#fff"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                  >{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 14, letterSpacing: "0.02em" }}>Legal</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Terms & Conditions", "/terms"], ["Privacy Policy", "/privacy"]].map(([label, href]) => (
                <li key={label}>
                  <a href={href} style={{
                    color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none",
                    transition: "color 120ms"
                  }}
                    onMouseEnter={e => e.target.style.color = "#fff"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                  >{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 20,
          color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center"
        }}>
          © {new Date().getFullYear()} Zoomo Eats. All rights reserved.
        </div>
      </div>
    </footer>
  );
}