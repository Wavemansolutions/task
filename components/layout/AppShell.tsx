'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export function AppShell({
  children,
  userName = 'Task Money User',
  userRole = 'worker',
  isAdmin = false,
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const effectiveIsAdmin = isAdmin || pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        userName={userName}
        userRole={userRole}
        isAdmin={effectiveIsAdmin}
      />
      <div className="lg:pl-64">
        <Topbar
          onMenu={() => setOpen(true)}
          userName={userName}
          userRole={userRole}
        />
        <main className="min-h-[calc(100vh-148px)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
