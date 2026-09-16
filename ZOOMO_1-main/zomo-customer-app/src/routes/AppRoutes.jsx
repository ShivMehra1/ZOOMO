import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import MainLayout from "../layout/MainLayout";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Restaurants from "../pages/Restaurants";
import Restaurant from "../pages/Restaurant";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Profile from "../pages/Profile";
import Search from "../pages/Search";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page (NO layout for hero effects) */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Pages wrapped inside MainLayout */}
      <Route
        path="/restaurants"
        element={
          <MainLayout>
            <Restaurants />
          </MainLayout>
        }
      />

      <Route
        path="/restaurant/:id"
        element={
          <MainLayout>
            <Restaurant />
          </MainLayout>
        }
      />

      <Route
        path="/cart"
        element={
          <MainLayout>
            <Cart />
          </MainLayout>
        }
      />

      <Route
        path="/checkout"
        element={
          <MainLayout>
            <Checkout />
          </MainLayout>
        }
      />

      <Route
        path="/orders"
        element={
          <MainLayout>
            <Orders />
          </MainLayout>
        }
      />

      <Route
        path="/orders/:id"
        element={
          <MainLayout>
            <OrderDetails />
          </MainLayout>
        }
      />

      <Route
        path="/profile"
        element={
          <MainLayout>
            <Profile />
          </MainLayout>
        }
      />

      <Route
        path="/search"
        element={
          <MainLayout>
            <Search />
          </MainLayout>
        }
      />
    </Routes>
  );
}
