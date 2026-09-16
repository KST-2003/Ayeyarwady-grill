import AdminSidebar from "../components/AdminSidebar";
import NotificationFeed from "../components/NotificationFeed";

export default function StaffNotificationsPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/notifications" />
      <main className="flex-1 px-10 py-10">
        <NotificationFeed subtitle="New orders, bookings, and payments needing action" />
      </main>
    </div>
  );
}
