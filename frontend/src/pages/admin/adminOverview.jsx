
import { useEffect, useState } from "react";
import {
  FaUsers,
  FaNewspaper,
  FaQuestionCircle,
  FaFlag,
  FaUserShield
} from "react-icons/fa";

import api from "../../services/api";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/overview");

        setStats(response.data?.data ?? response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: <FaUsers />,
      color: "text-blue-400"
    },
    {
      title: "Administrators",
      value: stats?.totalAdmins ?? 0,
      icon: <FaUserShield />,
      color: "text-purple-400"
    },
    {
      title: "Total Posts",
      value: stats?.totalPosts ?? 0,
      icon: <FaNewspaper />,
      color: "text-green-400"
    },
    {
      title: "Total Questions",
      value: stats?.totalQuestions ?? 0,
      icon: <FaQuestionCircle />,
      color: "text-yellow-400"
    },
    {
      title: "Total Reports",
      value: stats?.totalReports ?? 0,
      icon: <FaFlag />,
      color: "text-red-400"
    },
    {
      title: "Pending Reports",
      value: stats?.pendingReports ?? 0,
      icon: <FaFlag />,
      color: "text-orange-400"
    }
  ];

  if (loading) {
    return (
      <p className="text-gray-400">
        Loading dashboard statistics...
      </p>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>

      <div className="mb-8">
        <h2 className="text-xl font-bold">
          Dashboard Overview
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Here's what's happening on your platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-[#16171d] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all"
          >
            <div className="flex items-center justify-between mb-5">

              <p className="text-gray-400 text-sm">
                {card.title}
              </p>

              <span className={`${card.color} text-2xl`}>
                {card.icon}
              </span>

            </div>

            <h3 className="text-3xl font-bold text-white">
              {card.value}
            </h3>

          </div>
        ))}

      </div>

    </div>
  );
}
