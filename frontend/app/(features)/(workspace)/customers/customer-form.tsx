import Link from 'next/link';
import { CUSTOMER_GENDERS } from '@/lib/customers';
import { ContactEditor } from './contact-editor';

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  phones: { phone: string; isPrimary: boolean }[];
  addresses: { address: string; isDefault: boolean }[];
};

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  phones: [{ phone: '', isPrimary: true }],
  addresses: [{ address: '', isDefault: true }],
};

/** Form dùng chung cho tạo và cập nhật hồ sơ khách hàng. */
export function CustomerForm({
  action,
  values,
  submitLabel,
  cancelHref,
  showPassword = false,
  customerId = '',
  returnTo = '',
  locked = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: CustomerFormValues;
  submitLabel: string;
  cancelHref: string;
  showPassword?: boolean;
  customerId?: string;
  returnTo?: string;
  locked?: boolean;
}) {
  return (
    <form action={action} className="grid gap-5 px-6 py-6 md:grid-cols-2">
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div>
        <label htmlFor="lastName" className={LABEL_CLASS}>
          Họ
        </label>
        <input
          id="lastName"
          name="lastName"
          required
          maxLength={255}
          defaultValue={values.lastName}
          disabled={locked}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="firstName" className={LABEL_CLASS}>
          Tên
        </label>
        <input
          id="firstName"
          name="firstName"
          required
          maxLength={255}
          defaultValue={values.firstName}
          disabled={locked}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="email" className={LABEL_CLASS}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={255}
          defaultValue={values.email}
          disabled={locked}
          placeholder="ban@example.com"
          className={INPUT_CLASS}
        />
      </div>

      {showPassword && (
        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            Mật khẩu ban đầu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-[12px] text-muted">
            Khách sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="gender" className={LABEL_CLASS}>
          Giới tính
        </label>
        <select
          id="gender"
          name="gender"
          required
          defaultValue={values.gender}
          disabled={locked}
          className={INPUT_CLASS}
        >
          <option value="">Chọn giới tính</option>
          {CUSTOMER_GENDERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className={LABEL_CLASS}>
          Ngày sinh
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          defaultValue={values.dateOfBirth}
          disabled={locked}
          className={INPUT_CLASS}
        />
      </div>

      <ContactEditor
        phones={values.phones}
        addresses={values.addresses}
        locked={locked}
      />

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button
          type="submit"
          disabled={locked}
          className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="px-1 py-2 text-[13px] font-medium text-muted hover:text-accent hover:underline"
        >
          Huỷ
        </Link>
        {locked && (
          <span className="text-[12px] text-muted">
            Không thể chỉnh sửa khách hàng đã xoá.
          </span>
        )}
      </div>
    </form>
  );
}
