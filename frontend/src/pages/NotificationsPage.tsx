import CustomerSidebar from "../components/CustomerSidebar";
import NotificationFeed from "../components/NotificationFeed";

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard/notifications" />
      <main className="flex-1 px-10 py-10">
        <NotificationFeed subtitle="Booking confirmations and order updates" />
      </main>
    </div>
  );
}
