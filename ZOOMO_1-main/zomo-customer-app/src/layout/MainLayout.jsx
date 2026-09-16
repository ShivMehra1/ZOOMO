import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F5", color: "#0C1612" }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}