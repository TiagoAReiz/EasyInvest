import BottomNav from '@/components/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <BottomNav />
        {/* Content area: padding for bottom nav on mobile, margin for sidebar on desktop */}
        <main className="pb-20 lg:pb-0 lg:ml-[220px]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
