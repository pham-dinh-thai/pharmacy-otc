import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authFetch } from "@/lib/auth";

export type Role = {
  id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function RolesList() {
  const res = await authFetch("/roles");

  if (res.status === 401) redirect("/login?next=/roles");
  if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);

  const roles: Role[] = await res.json();

  return (
    <ul>
      {roles.map((role) => (
        <li key={role.id}>{role.name}</li>
      ))}
    </ul>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <RolesList />
    </Suspense>
  );
}
