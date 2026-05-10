import { Navbar }    from '@frontend/components/Navbar';
import { TopBar }    from '@frontend/components/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 56, paddingBottom: 92, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      <Navbar />
    </>
  );
}
