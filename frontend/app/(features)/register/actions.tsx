'use server';

import { redirect } from 'next/navigation';
import { BACKEND_URL } from '@/lib/session';

export async function handleRegister(formData: FormData) {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!firstName || !lastName || !email) {
    redirect('/register?error=missing');
  }

  if (password.length < 8) {
    redirect('/register?error=short');
  }

  if (password !== confirmPassword) {
    redirect('/register?error=mismatch');
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/authentication/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
      cache: 'no-store',
    });
  } catch {
    redirect('/register?error=server');
  }

  if (res.status === 409) {
    redirect('/register?error=exists');
  }

  if (!res.ok) {
    redirect('/register?error=server');
  }

  redirect('/login?registered=1');
}
