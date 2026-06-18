import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CountPage } from "./pages/CountPage";
import { DeliveryPage } from "./pages/DeliveryPage";
import { ReorderPage } from "./pages/ReorderPage";
import { ReportsPage } from "./pages/ReportsPage";
import { TrainingsPage, TrainingDetailPage } from "./pages/TrainingsPage";
import { AdminTrainingsPage } from "./pages/AdminTrainingsPage";

function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-gray-500">Cargando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/capacitaciones" replace />;
  }
  return <Layout>{children}</Layout>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "trabajador") return <Navigate to="/capacitaciones" replace />;
  return <DashboardPage />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="flex min-h-dvh items-center justify-center text-gray-500">Cargando...</p>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <Protected roles={["admin", "encargado"]}>
            <HomeRedirect />
          </Protected>
        }
      />
      <Route
        path="/conteo"
        element={
          <Protected roles={["admin", "encargado"]}>
            <CountPage />
          </Protected>
        }
      />
      <Route
        path="/recepcion"
        element={
          <Protected roles={["admin", "encargado"]}>
            <DeliveryPage />
          </Protected>
        }
      />
      <Route
        path="/surtido"
        element={
          <Protected roles={["admin", "encargado"]}>
            <ReorderPage />
          </Protected>
        }
      />
      <Route
        path="/reportes"
        element={
          <Protected roles={["admin", "encargado"]}>
            <ReportsPage />
          </Protected>
        }
      />
      <Route
        path="/capacitaciones"
        element={
          <Protected>
            <TrainingsPage />
          </Protected>
        }
      />
      <Route
        path="/capacitaciones/:id"
        element={
          <Protected>
            <TrainingDetailPage />
          </Protected>
        }
      />
      <Route
        path="/admin/capacitaciones"
        element={
          <Protected roles={["admin"]}>
            <AdminTrainingsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
