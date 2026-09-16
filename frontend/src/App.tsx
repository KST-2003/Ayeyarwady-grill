import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import MyBookingsPage from "./pages/MyBookingsPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import BookTablePage from "./pages/BookTablePage";
import QrOrderPage from "./pages/QrOrderPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import StaffDashboard from "./pages/StaffDashboard";
import StaffBookingsPage from "./pages/StaffBookingsPage";
import StaffNotificationsPage from "./pages/StaffNotificationsPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminTablesPage from "./pages/AdminTablesPage";
import AdminStaffPage from "./pages/AdminStaffPage";
import AdminPaymentMethodsPage from "./pages/AdminPaymentMethodsPage";
import AdminAuditLogPage from "./pages/AdminAuditLogPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/book" element={<BookTablePage />} />
      <Route path="/order" element={<QrOrderPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allow={["CUSTOMER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/bookings"
        element={
          <ProtectedRoute allow={["CUSTOMER"]}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/orders"
        element={
          <ProtectedRoute allow={["CUSTOMER"]}>
            <OrderHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute allow={["CUSTOMER"]}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute allow={["CUSTOMER"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allow={["STAFF", "ADMIN"]}>
            <AdminOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/orders"
        element={
          <ProtectedRoute allow={["STAFF", "ADMIN"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/bookings"
        element={
          <ProtectedRoute allow={["STAFF", "ADMIN"]}>
            <StaffBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/notifications"
        element={
          <ProtectedRoute allow={["STAFF", "ADMIN"]}>
            <StaffNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/attendance"
        element={
          <ProtectedRoute allow={["STAFF", "ADMIN"]}>
            <AdminAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tables"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminTablesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminStaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payment-methods"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminPaymentMethodsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-log"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminAuditLogPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
