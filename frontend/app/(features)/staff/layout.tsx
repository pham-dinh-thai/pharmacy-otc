import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { canAccessStaff, fetchCurrentUser } from '@/lib/account';
import { staffNav } from '@/lib/workspace';

async function StaffWorkspace({ children }: { children: React.ReactNode }) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/staff');
  if (!canAccessStaff(user)) redirect('/account');

  return <WorkspaceShell nav={staffNav(user)}>{children}</WorkspaceShell>;
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StaffWorkspace>{children}</StaffWorkspace>
    </Suspense>
  );
}
