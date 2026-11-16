import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { canAccessAdmin, fetchCurrentUser } from '@/lib/account';
import { adminNav } from '@/lib/workspace';

async function AdminWorkspace({ children }: { children: React.ReactNode }) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/admin');
  if (!canAccessAdmin(user)) redirect('/account');

  return <WorkspaceShell nav={adminNav(user)}>{children}</WorkspaceShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminWorkspace>{children}</AdminWorkspace>
    </Suspense>
  );
}
