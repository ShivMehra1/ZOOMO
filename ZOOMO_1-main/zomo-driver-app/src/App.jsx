import AppRoutes from "./routes/AppRoutes";
import { DriverAuthProvider } from "./context/DriverAuthContext";
export default function App() {
  return (
    <DriverAuthProvider>
      <AppRoutes />
    </DriverAuthProvider>
  );
}
