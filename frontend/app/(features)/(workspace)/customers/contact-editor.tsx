'use client';

import { useRef, useState } from 'react';

type PhoneRow = { key: number; phone: string; isPrimary: boolean };
type AddressRow = { key: number; address: string; isDefault: boolean };

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2 text-[13px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';
const BUTTON_CLASS =
  'border border-rule px-2.5 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50';

function initialPhones(phones: { phone: string; isPrimary: boolean }[]): PhoneRow[] {
  const source = phones.length ? phones : [{ phone: '', isPrimary: true }];
  const hasPrimary = source.some((item) => item.isPrimary);

  return source.map((item, index) => ({
    key: index + 1,
    phone: item.phone,
    isPrimary: hasPrimary ? item.isPrimary : index === 0,
  }));
}

function initialAddresses(
  addresses: { address: string; isDefault: boolean }[],
): AddressRow[] {
  const source = addresses.length
    ? addresses
    : [{ address: '', isDefault: true }];
  const hasDefault = source.some((item) => item.isDefault);

  return source.map((item, index) => ({
    key: index + 1,
    address: item.address,
    isDefault: hasDefault ? item.isDefault : index === 0,
  }));
}

/**
 * Danh sách điện thoại/địa chỉ có thể thêm bớt. Dùng radio để đảm bảo luôn có
 * đúng một cờ chính; server action đọc chỉ số qua `value` của radio.
 */
export function ContactEditor({
  phones,
  addresses,
  locked = false,
}: {
  phones: { phone: string; isPrimary: boolean }[];
  addresses: { address: string; isDefault: boolean }[];
  locked?: boolean;
}) {
  const nextKey = useRef(
    Math.max(phones.length, addresses.length, 1) + 1,
  );
  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>(() =>
    initialPhones(phones),
  );
  const [addressRows, setAddressRows] = useState<AddressRow[]>(() =>
    initialAddresses(addresses),
  );

  return (
    <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
      <section>
        <h3 className="text-[13px] font-semibold">Số điện thoại</h3>
        <p className="mt-1 text-[12px] text-muted">
          Chọn một số làm số chính. Phải có ít nhất một số.
        </p>

        <div className="mt-3 space-y-3">
          {phoneRows.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                name="phone"
                value={row.phone}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setPhoneRows((rows) =>
                    rows.map((item) =>
                      item.key === row.key ? { ...item, phone: value } : item,
                    ),
                  );
                }}
                required
                maxLength={30}
                placeholder="Số điện thoại"
                disabled={locked}
                className={INPUT_CLASS}
              />
              <label className="flex shrink-0 items-center gap-1 text-[12px] text-muted">
                <input
                  type="radio"
                  name="phonePrimary"
                  value={index}
                  checked={row.isPrimary}
                  onChange={() =>
                    setPhoneRows((rows) =>
                      rows.map((item) => ({
                        ...item,
                        isPrimary: item.key === row.key,
                      })),
                    )
                  }
                  disabled={locked}
                />
                Chính
              </label>
              <button
                type="button"
                disabled={locked || phoneRows.length === 1}
                onClick={() =>
                  setPhoneRows((rows) =>
                    rows.filter((item) => item.key !== row.key),
                  )
                }
                className={BUTTON_CLASS}
                aria-label={`Xoá số điện thoại ${index + 1}`}
              >
                Xoá
              </button>
            </div>
          ))}
        </div>

        {!locked && (
          <button
            type="button"
            onClick={() =>
              setPhoneRows((rows) => [
                ...rows,
                {
                  key: nextKey.current++,
                  phone: '',
                  isPrimary: false,
                },
              ])
            }
            className="mt-3 text-[12px] font-medium text-accent hover:underline"
          >
            + Thêm số điện thoại
          </button>
        )}
      </section>

      <section>
        <h3 className="text-[13px] font-semibold">Địa chỉ giao hàng</h3>
        <p className="mt-1 text-[12px] text-muted">
          Chọn một địa chỉ làm mặc định. Phải có ít nhất một địa chỉ.
        </p>

        <div className="mt-3 space-y-3">
          {addressRows.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                name="address"
                value={row.address}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setAddressRows((rows) =>
                    rows.map((item) =>
                      item.key === row.key ? { ...item, address: value } : item,
                    ),
                  );
                }}
                required
                maxLength={500}
                placeholder="Địa chỉ giao hàng"
                disabled={locked}
                className={INPUT_CLASS}
              />
              <label className="flex shrink-0 items-center gap-1 text-[12px] text-muted">
                <input
                  type="radio"
                  name="addressDefault"
                  value={index}
                  checked={row.isDefault}
                  onChange={() =>
                    setAddressRows((rows) =>
                      rows.map((item) => ({
                        ...item,
                        isDefault: item.key === row.key,
                      })),
                    )
                  }
                  disabled={locked}
                />
                Mặc định
              </label>
              <button
                type="button"
                disabled={locked || addressRows.length === 1}
                onClick={() =>
                  setAddressRows((rows) =>
                    rows.filter((item) => item.key !== row.key),
                  )
                }
                className={BUTTON_CLASS}
                aria-label={`Xoá địa chỉ ${index + 1}`}
              >
                Xoá
              </button>
            </div>
          ))}
        </div>

        {!locked && (
          <button
            type="button"
            onClick={() =>
              setAddressRows((rows) => [
                ...rows,
                {
                  key: nextKey.current++,
                  address: '',
                  isDefault: false,
                },
              ])
            }
            className="mt-3 text-[12px] font-medium text-accent hover:underline"
          >
            + Thêm địa chỉ
          </button>
        )}
      </section>
    </div>
  );
}
