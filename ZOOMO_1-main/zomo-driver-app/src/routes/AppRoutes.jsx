import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/login";
import Home from "../pages/Home";
import { useDriverAuth } from "../context/DriverAuthContext";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import ProtectedRoute from "./ProtectedRoute";
import DeliveryComplete from "../pages/DeliveryComplete";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Earnings from "../pages/Earnings";
import Support from "../pages/Support";

function LandingOrHome() {
  const { isAuthenticated, loading } = useDriverAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <Landing />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingOrHome />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
  path="/delivery-complete"
  element={
    <ProtectedRoute>
      <DeliveryComplete />
    </ProtectedRoute>
  }
/>
    <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <Earnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<LandingOrHome />} />
      </Routes>
    </BrowserRouter>
  );
}
