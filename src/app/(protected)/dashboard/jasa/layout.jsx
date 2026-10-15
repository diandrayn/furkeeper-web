'use client';

import DashboardRoute from '@/components/dashboard/DashboardRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardJasaLayout({ children }) {
  return (
    <DashboardRoute statusField="providerStatus">
      <DashboardLayout mode="jasa">{children}</DashboardLayout>
    </DashboardRoute>
  );
}
