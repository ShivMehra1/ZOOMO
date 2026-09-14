import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", color: "#0B0F0E" }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}