import Sidebar from '@/components/Layouts/Sidebar';
import Header from '@/components/Layouts/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      <Header />
      <div className="dashboard-content">
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
