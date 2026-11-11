
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/adminSidebar";

export default function AdminDashboard({ user }) {
  return (
    <div className="min-h-screen bg-[#101116] text-white md:flex">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-5 md:p-8">

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Panel
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Manage and monitor your Quora platform.
            </p>
          </div>

          <div className="bg-[#202127] border border-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-xs">
              Logged in as
            </p>

            <p className="text-white font-semibold text-sm">
              {user?.name || "Administrator"}
            </p>
          </div>
        </header>

        {/* Selected admin page appears here */}
        <Outlet />

      </main>
    </div>
  );
}
