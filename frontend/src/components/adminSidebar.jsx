
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaNewspaper,
  FaFlag,
  FaCog,
  FaArrowLeft,
  FaShieldAlt
} from "react-icons/fa";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const links = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <FaTachometerAlt />
    },
    {
      name: "Manage Users",
      path: "/admin/users",
      icon: <FaUsers />
    },
    {
      name: "Manage Posts",
      path: "/admin/posts",
      icon: <FaNewspaper />
    },
    {
      name: "Manage Reports",
      path: "/admin/reports",
      icon: <FaFlag />
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <FaCog />
    }
  ];

  return (
    <aside className="w-full md:w-64 min-h-screen bg-[#16171d] border-r border-gray-800 p-5 flex flex-col">

      {/* Admin Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-red-600 p-3 rounded-xl">
          <FaShieldAlt className="text-white text-xl" />
        </div>

        <div>
          <h2 className="text-white font-bold text-xl">
            Quora Admin
          </h2>
          <p className="text-gray-500 text-xs">
            Administration Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        <p className="text-gray-500 uppercase text-xs font-semibold mb-2">
          Main Menu
        </p>

        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:bg-[#25262d] hover:text-white"
              }`
            }
          >
            <span>{link.icon}</span>
            <span className="text-sm font-medium">
              {link.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Back to application */}
      <button
        onClick={() => navigate("/feed")}
        className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#25262d] px-4 py-3 rounded-lg transition-all mt-8"
      >
        <FaArrowLeft />
        <span className="text-sm">Back to Quora</span>
      </button>

    </aside>
  );
}
