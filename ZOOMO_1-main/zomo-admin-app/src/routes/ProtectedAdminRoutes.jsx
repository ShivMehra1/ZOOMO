import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layouts/AdminLayout";

export default function ProtectedAdminRoute({ children }) {
  const { admin } = useAdminAuth();

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children ?? <AdminLayout />;
}
