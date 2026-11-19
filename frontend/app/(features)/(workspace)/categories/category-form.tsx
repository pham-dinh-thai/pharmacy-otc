import Link from 'next/link';

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
};

export const EMPTY_CATEGORY_FORM: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
};

/** Form dùng chung cho tạo và cập nhật danh mục. */
export function CategoryForm({
  action,
  values,
  submitLabel,
  cancelHref,
  categoryId = '',
  returnTo = '',
  locked = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: CategoryFormValues;
  submitLabel: string;
  cancelHref: string;
  categoryId?: string;
  returnTo?: string;
  locked?: boolean;
}) {
  return (
    <form action={action} className="grid gap-5 px-6 py-6 md:grid-cols-2">
      {categoryId && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div>
        <label htmlFor="name" className={LABEL_CLASS}>
          Tên danh mục
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          defaultValue={values.name}
          disabled={locked}
          placeholder="Ví dụ: Thuốc cảm cúm"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="slug" className={LABEL_CLASS}>
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          maxLength={255}
          defaultValue={values.slug}
          disabled={locked}
          placeholder="Tự sinh từ tên nếu để trống"
          className={INPUT_CLASS}
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="description" className={LABEL_CLASS}>
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={255}
          defaultValue={values.description}
          disabled={locked}
          placeholder="Mô tả ngắn về danh mục"
          className={`${INPUT_CLASS} resize-y`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={locked}
          className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:bg-rule disabled:text-muted"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="border border-rule px-5 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Huỷ
        </Link>
      </div>
    </form>
  );
}
