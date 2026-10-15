'use client';

import DashboardRoute from '@/components/dashboard/DashboardRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardTokoLayout({ children }) {
  return (
    <DashboardRoute statusField="sellerStatus">
      <DashboardLayout mode="toko">{children}</DashboardLayout>
    </DashboardRoute>
  );
}
