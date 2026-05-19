import Sidebar from '@/components/Layouts/Sidebar';
import Header from '@/components/Layouts/Header';
import PrintReceipt from '@/components/PrintReceipt';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print:bg-white">
      <div className="print:hidden">
        <Sidebar />
        <Header />
      </div>
      <div className="dashboard-content print:!ml-0 print:!p-0 print:!w-full print:!h-auto print:!overflow-visible print:hidden">
        <main className="page-container print:!p-0">{children}</main>
      </div>
      <PrintReceipt />
    </div>
  );
}
