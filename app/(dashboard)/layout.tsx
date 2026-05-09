import { Navbar } from '@frontend/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 96, position: 'relative', zIndex: 1 }}>
      {children}
      <Navbar />
    </div>
  );
}
