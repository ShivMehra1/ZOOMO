import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "../pages/Orders";
import Drivers from "../pages/Drivers";
import Users from "../pages/Users";
import Restaurants from "../pages/Restaurants";
import RestaurantDetail from "../pages/RestaurantDetail";
import Analytics from "../pages/Analytics";
import Disputes from "../pages/Disputes";
import Finance from "../pages/Finance";
import Payouts from "../pages/Payouts";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="analytics" />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="orders" element={<Orders />} />
      <Route path="drivers" element={<Drivers />} />
      <Route path="users" element={<Users />} />
      <Route path="restaurants" element={<Restaurants />} />
      <Route path="restaurants/:id" element={<RestaurantDetail />} />
      <Route path="disputes" element={<Disputes />} />
      <Route path="finance" element={<Finance />} />
      <Route path="payouts" element={<Payouts />} />
    </Routes>
  );
}
