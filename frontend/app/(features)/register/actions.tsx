'use server';

import { redirect } from 'next/navigation';
import { isCustomerGender } from '@/lib/customers';
import { BACKEND_URL } from '@/lib/session';

export async function handleRegister(formData: FormData) {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const gender = String(formData.get('gender') ?? '').trim();
  const dateOfBirth = String(formData.get('dateOfBirth') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  if (!firstName || !lastName || !email) {
    redirect('/register?error=missing');
  }

  if (password.length < 8) {
    redirect('/register?error=short');
  }

  if (password !== confirmPassword) {
    redirect('/register?error=mismatch');
  }

  if (!gender || !dateOfBirth || !phone || !address) {
    redirect('/register?error=profile');
  }

  if (
    !isCustomerGender(gender) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
    phone.length > 30 ||
    address.length > 500
  ) {
    redirect('/register?error=invalid');
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/authentication/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        gender,
        dateOfBirth,
        phones: [{ phone, isPrimary: true }],
        addresses: [{ address, isDefault: true }],
      }),
      cache: 'no-store',
    });
  } catch {
    redirect('/register?error=server');
  }

  if (res.status === 409) {
    redirect('/register?error=exists');
  }

  if (res.status === 400 || res.status === 422) {
    redirect('/register?error=invalid');
  }

  if (!res.ok) {
    redirect('/register?error=server');
  }

  redirect('/login?registered=1');
}
