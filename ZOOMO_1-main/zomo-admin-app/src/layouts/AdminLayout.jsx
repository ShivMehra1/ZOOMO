import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-z-page">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
