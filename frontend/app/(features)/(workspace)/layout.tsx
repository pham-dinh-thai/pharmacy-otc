import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { fetchCurrentUser } from '@/lib/account';
import { workspaceNav } from '@/lib/workspace';

async function Workspace({ children }: { children: React.ReactNode }) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/dashboard');

  if (user.mustChangePassword) redirect('/account/password');

  return <WorkspaceShell nav={workspaceNav(user)}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Workspace>{children}</Workspace>
    </Suspense>
  );
}
