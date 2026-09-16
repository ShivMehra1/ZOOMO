import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-z-page">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
