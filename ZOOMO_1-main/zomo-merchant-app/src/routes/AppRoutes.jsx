import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Onboarding from "../pages/Onboarding";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Menu from "../pages/Menu";
import AddDish from "../pages/AddDish";
import EditDish from "../pages/EditDish";
import RestaurantProfile from "../pages/RestaurantProfile";
import Analytics from "../pages/Analytics";
import Promotions from "../pages/Promotions";
import Reviews from "../pages/Reviews";

import PublicLayout from "../layout/PublicLayout";
import DashboardLayout from "../layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />

      <Route
        path="/login"
        element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicLayout>
            <Signup />
          </PublicLayout>
        }
      />

      {/* ================= PROTECTED ROUTES ================= */}

      {/* Dashboard = gatekeeper */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Onboarding (only reachable if no restaurant) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Onboarding />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Orders */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Orders />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders/:restaurantId/:orderId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <OrderDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* Menu */}
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Menu />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu/add"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AddDish />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditDish />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Restaurant Profile */}
      <Route
        path="/restaurant"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RestaurantProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Promotions */}
      <Route
        path="/promotions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Promotions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Reviews */}
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reviews />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
