import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoutes";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { AdminInboxProvider } from "./context/AdminInboxContext";
import Orders from "./pages/Orders";
import Drivers from "./pages/Drivers";
import DriverDetail from "./pages/DriverDetail";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Analytics from "./pages/Analytics";
import Disputes from "./pages/Disputes";
import Finance from "./pages/Finance";
import Payouts from "./pages/Payouts";
import Offers from "./pages/Offers";

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <ConfirmProvider>
          <AdminInboxProvider>
            <Routes>
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedAdminRoute />}>
                <Route index element={<Navigate to="analytics" replace />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="orders" element={<Orders />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="drivers/:id" element={<DriverDetail />} />
                <Route path="users" element={<Users />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="restaurants" element={<Restaurants />} />
                <Route path="restaurants/:id" element={<RestaurantDetail />} />
                <Route path="disputes" element={<Disputes />} />
                <Route path="finance" element={<Finance />} />
                <Route path="payouts" element={<Payouts />} />
                <Route path="offers" element={<Offers />} />
              </Route>
              <Route path="/" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
            </Routes>
          </AdminInboxProvider>
        </ConfirmProvider>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
