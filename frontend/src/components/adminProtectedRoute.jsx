
import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute({ user }) {
  // A user must be logged in first.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Only administrators can access admin routes.
  if (user.role !== "admin") {
    return <Navigate to="/feed" replace />;
  }

  // Allow administrators to continue.
  return <Outlet />;
}


