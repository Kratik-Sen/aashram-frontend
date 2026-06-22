import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ashram-cream">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
