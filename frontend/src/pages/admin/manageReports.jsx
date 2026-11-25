
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
} from "lucide-react";

import api from "../../services/api";

const STATUS_OPTIONS = [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
];

export default function ManageReports() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState("reviewed");
  const [resolutionNote, setResolutionNote] = useState("");

  // FETCH REPORTS
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      if (status !== "all") {
        params.status = status;
      }

      const response = await api.get("/admin/reports", { params });

      const result = response.data?.data;

      setReports(Array.isArray(result) ? result : []);

      setPagination(
        response.data?.pagination || {
          total: 0,
          totalPages: 1,
          limit: 10,
        }
      );
    } catch (err) {
      console.error("Fetch reports error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // OPEN UPDATE MODAL
  const openUpdateModal = (report) => {
    setSelectedReport(report);
    setNewStatus(
      report.status === "pending" ? "reviewed" : report.status
    );
    setResolutionNote(report.resolutionNote || "");
    setError("");
    setSuccessMessage("");
  };

  // UPDATE REPORT STATUS
  const handleUpdateReport = async (e) => {
    e.preventDefault();

    if (!selectedReport) return;

    try {
      setUpdatingReportId(selectedReport._id);
      setError("");
      setSuccessMessage("");

      await api.patch(
        `/admin/reports/${selectedReport._id}`,
        {
          status: newStatus,
          resolutionNote: resolutionNote.trim(),
        }
      );

      setSelectedReport(null);
      setSuccessMessage("Report updated successfully.");

      await fetchReports();
    } catch (err) {
      console.error("Update report error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update this report."
      );
    } finally {
      setUpdatingReportId(null);
    }
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleString();
  };

  // STATUS STYLES
  const getStatusStyle = (reportStatus) => {
    switch (reportStatus) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      case "reviewed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "resolved":
        return "bg-green-500/10 text-green-400 border-green-500/20";

      case "dismissed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";

      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = (reportStatus) => {
    switch (reportStatus) {
      case "pending":
        return <Clock size={14} />;

      case "reviewed":
        return <Eye size={14} />;

      case "resolved":
        return <CheckCircle size={14} />;

      case "dismissed":
        return <XCircle size={14} />;

      default:
        return <AlertCircle size={14} />;
    }
  };

  // REPORT TYPE LABEL
  const getTargetLabel = (targetType) => {
    if (!targetType) return "Unknown";

    return (
      targetType.charAt(0).toUpperCase() +
      targetType.slice(1)
    );
  };

  return (
    <div className="space-y-6 text-white">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Manage Reports
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Review and manage content reported by users.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#24252d] border border-gray-700 hover:bg-[#30313a] transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Total Reports
            </p>
            <FileText className="text-purple-400" size={22} />
          </div>

          <h3 className="text-2xl font-bold mt-3">
            {pagination.total || 0}
          </h3>
        </div>

        <div className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Pending
            </p>
            <Clock className="text-yellow-400" size={22} />
          </div>

          <h3 className="text-2xl font-bold mt-3">
            {reports.filter((report) => report.status === "pending").length}
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            On this page
          </p>
        </div>

        <div className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Resolved
            </p>
            <CheckCircle className="text-green-400" size={22} />
          </div>

          <h3 className="text-2xl font-bold mt-3">
            {reports.filter((report) => report.status === "resolved").length}
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            On this page
          </p>
        </div>

        <div className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Dismissed
            </p>
            <XCircle className="text-gray-400" size={22} />
          </div>

          <h3 className="text-2xl font-bold mt-3">
            {reports.filter((report) => report.status === "dismissed").length}
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            On this page
          </p>
        </div>

      </div>

      {/* FILTER */}
      <div className="bg-[#1b1c23] border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>
            <h3 className="font-semibold">
              Reported Content
            </h3>

            <p className="text-gray-400 text-xs mt-1">
              Filter reports by their current status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Search size={16} className="text-gray-400" />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#25262e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
            >
              <option value="all">All Reports</option>

              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getTargetLabel(option)}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && !selectedReport && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* REPORT LIST */}
      <div className="bg-[#1b1c23] border border-gray-800 rounded-xl overflow-hidden">

        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-400">
            <RefreshCw className="animate-spin mr-2" size={20} />
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShieldCheck
              size={42}
              className="mx-auto text-gray-600 mb-3"
            />

            <h3 className="font-semibold text-gray-300">
              No reports found
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              There are no reports matching this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">

            {reports.map((report) => (
              <div
                key={report._id}
                className="p-5 hover:bg-[#202129] transition"
              >

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                  {/* REPORT DETAILS */}
                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-2 mb-3">

                      <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {getTargetLabel(report.targetType)}
                      </span>

                      <span
                        className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${getStatusStyle(report.status)}`}
                      >
                        {getStatusIcon(report.status)}
                        {getTargetLabel(report.status)}
                      </span>

                    </div>

                    <h4 className="font-semibold text-white mb-2">
                      Report reason
                    </h4>

                    <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                      {report.reason || "No reason provided"}
                    </p>

                    {report.details && (
                      <div className="mt-3">
                        <p className="text-gray-500 text-xs mb-1">
                          Additional details
                        </p>

                        <p className="text-gray-400 text-sm whitespace-pre-wrap break-words">
                          {report.details}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-gray-500">

                      <span>
                        Reported by:{" "}
                        <span className="text-gray-300">
                          {report.reportedBy?.name ||
                            report.reportedBy?.username ||
                            "Unknown user"}
                        </span>
                      </span>

                      <span>
                        Submitted: {formatDate(report.createdAt)}
                      </span>

                    </div>

                    {report.resolutionNote && (
                      <div className="mt-4 p-3 bg-[#15161c] border border-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Resolution note
                        </p>

                        <p className="text-sm text-gray-300">
                          {report.resolutionNote}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* ACTION */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40">

                    <button
                      onClick={() => openUpdateModal(report)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
                    >
                      <Eye size={15} />
                      Review Report
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Report ID: {report._id}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* PAGINATION */}
      {!loading && reports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-gray-400 text-sm">
            Total reports: {pagination.total || 0}
          </p>

          <div className="flex items-center gap-3">

            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#24252d] border border-gray-700 disabled:opacity-40 hover:bg-[#30313a]"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-gray-400">
              Page {page} of {pagination.totalPages || 1}
            </span>

            <button
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((current) => current + 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#24252d] border border-gray-700 disabled:opacity-40 hover:bg-[#30313a]"
            >
              Next
              <ChevronRight size={16} />
            </button>

          </div>

        </div>
      )}

      {/* UPDATE REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

          <div className="bg-[#1b1c23] border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h3 className="text-xl font-bold">
                  Review Report
                </h3>

                <p className="text-gray-400 text-xs mt-1">
                  Update the report status and add a note.
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white text-xl"
                aria-label="Close modal"
              >
                ×
              </button>

            </div>

            <div className="bg-[#15161c] rounded-lg p-4 mb-5">

              <p className="text-xs text-gray-500 mb-2">
                Report reason
              </p>

              <p className="text-sm text-gray-200">
                {selectedReport.reason}
              </p>

              <p className="text-xs text-gray-500 mt-3">
                Content type: {getTargetLabel(selectedReport.targetType)}
              </p>

            </div>

            <form onSubmit={handleUpdateReport} className="space-y-4">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Report Status
                </label>

                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#25262e] border border-gray-700 rounded-lg px-3 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Resolution Note
                </label>

                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  placeholder="Explain the action taken or why this report was dismissed..."
                  className="w-full bg-[#25262e] border border-gray-700 rounded-lg px-3 py-3 text-sm text-white outline-none resize-none focus:border-red-500"
                />
              </div>

              {error && selectedReport && (
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingReportId === selectedReport._id}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {updatingReportId === selectedReport._id
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
