import { ROLE_CREATED_EVENT } from '../../../authorization/domain/events/role-created.event';
import { PERMISSION_GRANTED_EVENT } from '../../../authorization/domain/events/permission-granted.event';
import { ROLE_RENAMED_EVENT } from '../../../authorization/domain/events/role-renamed.event';
import { ROLE_REVOKED_EVENT } from '../../../authorization/domain/events/role-revoked.event';
import { ROLE_DISABLED_EVENT } from '../../../authorization/domain/events/role-disabled.event';
import { ROLE_RESTORED_EVENT } from '../../../authorization/domain/events/role-restored.event';
import { SUPER_ADMIN_SET_EVENT } from '../../../authorization/domain/events/super-admin-set.event';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../authentication/domain/events/account-signed-up.event';
import { ACCOUNT_SIGNED_IN_EVENT } from '../../../authentication/domain/events/account-signed-in.event';
import { USER_CREATED_EVENT } from '../../../users/domain/events/user-created.event';
import { USER_EMAIL_CHANGED_EVENT } from '../../../users/domain/events/user-email-changed.event';
import { USER_ROLE_ASSIGNED_EVENT } from '../../../users/domain/events/user-role-assigned.event';
import { USER_ROLE_REMOVED_EVENT } from '../../../users/domain/events/user-role-removed.event';
import { PRODUCT_CREATED_EVENT } from '../../../products/domain/events/product-created.event';
import { PRODUCT_UPDATED_EVENT } from '../../../products/domain/events/product-updated.event';
import { PRODUCT_DELETED_EVENT } from '../../../products/domain/events/product-deleted.event';
import { PRODUCT_RESTORED_EVENT } from '../../../products/domain/events/product-restored.event';
import { CATEGORY_CREATED_EVENT } from '../../../categories/domain/events/category-created.event';
import { CATEGORY_UPDATED_EVENT } from '../../../categories/domain/events/category-updated.event';
import { CATEGORY_DELETED_EVENT } from '../../../categories/domain/events/category-deleted.event';
import { CATEGORY_RESTORED_EVENT } from '../../../categories/domain/events/category-restored.event';
import { SUPPLIER_CREATED_EVENT } from '../../../suppliers/domain/events/supplier-created.event';
import { SUPPLIER_UPDATED_EVENT } from '../../../suppliers/domain/events/supplier-updated.event';
import { SUPPLIER_DELETED_EVENT } from '../../../suppliers/domain/events/supplier-deleted.event';
import { SUPPLIER_RESTORED_EVENT } from '../../../suppliers/domain/events/supplier-restored.event';
import { GOODS_RECEIPT_CREATED_EVENT } from '../../../goods-receipts/domain/events/goods-receipt-created.event';
import { GOODS_RECEIPT_CONFIRMED_EVENT } from '../../../goods-receipts/domain/events/goods-receipt-confirmed.event';
import { GOODS_RECEIPT_CANCELLED_EVENT } from '../../../goods-receipts/domain/events/goods-receipt-cancelled.event';
import { INVENTORY_STOCK_ISSUED_EVENT } from '../../../inventories/domain/events/inventory-stock-issued.event';
import { INVENTORY_STOCK_RECONCILED_EVENT } from '../../../inventories/domain/events/inventory-stock-reconciled.event';
import { EXPENSE_CREATED_EVENT } from '../../../expenses/domain/events/expense-created.event';
import { EXPENSE_UPDATED_EVENT } from '../../../expenses/domain/events/expense-updated.event';
import { EXPENSE_APPROVED_EVENT } from '../../../expenses/domain/events/expense-approved.event';
import { EXPENSE_SUPPLIER_PAID_EVENT } from '../../../expenses/domain/events/expense-supplier-paid.event';
import { EXPENSE_PAID_EVENT } from '../../../expenses/domain/events/expense-paid.event';
import { EXPENSE_CANCELLED_EVENT } from '../../../expenses/domain/events/expense-cancelled.event';
import { PASSWORD_CHANGED_AUDIT_EVENT } from '../../../authentication/domain/events/password-changed.event';
import { EMPLOYEE_STATUS_CHANGED_EVENT } from '../../../employees/domain/events/employee-status-changed.event';
import { USER_DEACTIVATED_EVENT } from '../../../users/domain/events/user-deactivated.event';
import { DEPARTMENT_CREATED_EVENT } from '../../../departments/domain/events/department-created.event';
import { DEPARTMENT_UPDATED_EVENT } from '../../../departments/domain/events/department-updated.event';
import { DEPARTMENT_DISABLED_EVENT } from '../../../departments/domain/events/department-disabled.event';
import { DEPARTMENT_RESTORED_EVENT } from '../../../departments/domain/events/department-restored.event';
import { EMPLOYEE_CREATED_EVENT } from '../../../employees/domain/events/employee-created.event';
import { EMPLOYEE_UPDATED_EVENT } from '../../../employees/domain/events/employee-updated.event';
import { CUSTOMER_CREATED_EVENT } from '../../../customers/domain/events/customer-created.event';
import { CUSTOMER_UPDATED_EVENT } from '../../../customers/domain/events/customer-updated.event';
import { CUSTOMER_DELETED_EVENT } from '../../../customers/domain/events/customer-deleted.event';
import { CUSTOMER_RESTORED_EVENT } from '../../../customers/domain/events/customer-restored.event';

/**
 * Verbs stored in `audit_logs.action`. The outbox event type identifies the
 * message and its consumer; the action describes what the actor did.
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'rename'
  | 'grant_permission'
  | 'revoke_permission'
  | 'set_super_admin'
  | 'sign_up'
  | 'sign_in'
  | 'change_email'
  | 'assign_role'
  | 'remove_role'
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'restore'
  | 'confirm'
  | 'approve'
  | 'pay'
  | 'cancel'
  | 'issue'
  | 'reconcile'
  | 'change_password';

/**
 * Event types persisted as audit rows, mapped to the action they record.
 * Adding an audited event only requires one entry here; the consumer itself
 * is generic.
 */
export const AUDITED_EVENT_ACTIONS = {
  [ROLE_CREATED_EVENT]: 'create',
  [PERMISSION_GRANTED_EVENT]: 'grant_permission',
  [ROLE_RENAMED_EVENT]: 'rename',
  [ROLE_REVOKED_EVENT]: 'revoke_permission',
  [ROLE_DISABLED_EVENT]: 'deactivate',
  [ROLE_RESTORED_EVENT]: 'activate',
  [SUPER_ADMIN_SET_EVENT]: 'set_super_admin',
  [ACCOUNT_SIGNED_UP_EVENT]: 'sign_up',
  [ACCOUNT_SIGNED_IN_EVENT]: 'sign_in',
  [USER_CREATED_EVENT]: 'create',
  [USER_EMAIL_CHANGED_EVENT]: 'change_email',
  [USER_ROLE_ASSIGNED_EVENT]: 'assign_role',
  [USER_ROLE_REMOVED_EVENT]: 'remove_role',
  [PRODUCT_CREATED_EVENT]: 'create',
  [PRODUCT_UPDATED_EVENT]: 'update',
  [PRODUCT_DELETED_EVENT]: 'delete',
  [PRODUCT_RESTORED_EVENT]: 'restore',
  [CATEGORY_CREATED_EVENT]: 'create',
  [CATEGORY_UPDATED_EVENT]: 'update',
  [CATEGORY_DELETED_EVENT]: 'delete',
  [CATEGORY_RESTORED_EVENT]: 'restore',
  [SUPPLIER_CREATED_EVENT]: 'create',
  [SUPPLIER_UPDATED_EVENT]: 'update',
  [SUPPLIER_DELETED_EVENT]: 'delete',
  [SUPPLIER_RESTORED_EVENT]: 'restore',
  [GOODS_RECEIPT_CREATED_EVENT]: 'create',
  [GOODS_RECEIPT_CONFIRMED_EVENT]: 'confirm',
  [GOODS_RECEIPT_CANCELLED_EVENT]: 'cancel',
  [INVENTORY_STOCK_ISSUED_EVENT]: 'issue',
  [INVENTORY_STOCK_RECONCILED_EVENT]: 'reconcile',
  [EXPENSE_CREATED_EVENT]: 'create',
  [EXPENSE_UPDATED_EVENT]: 'update',
  [EXPENSE_APPROVED_EVENT]: 'approve',
  [EXPENSE_SUPPLIER_PAID_EVENT]: 'pay',
  [EXPENSE_PAID_EVENT]: 'pay',
  [EXPENSE_CANCELLED_EVENT]: 'cancel',
  [PASSWORD_CHANGED_AUDIT_EVENT]: 'change_password',
  [EMPLOYEE_STATUS_CHANGED_EVENT]: 'update',
  [USER_DEACTIVATED_EVENT]: 'deactivate',
  [DEPARTMENT_CREATED_EVENT]: 'create',
  [DEPARTMENT_UPDATED_EVENT]: 'update',
  [DEPARTMENT_DISABLED_EVENT]: 'deactivate',
  [DEPARTMENT_RESTORED_EVENT]: 'activate',
  [EMPLOYEE_CREATED_EVENT]: 'create',
  [EMPLOYEE_UPDATED_EVENT]: 'update',
  [CUSTOMER_CREATED_EVENT]: 'create',
  [CUSTOMER_UPDATED_EVENT]: 'update',
  [CUSTOMER_DELETED_EVENT]: 'delete',
  [CUSTOMER_RESTORED_EVENT]: 'restore',
} as const satisfies Record<string, AuditAction>;

export type AuditedEventType = keyof typeof AUDITED_EVENT_ACTIONS;

export const AUDITED_EVENT_TYPES: readonly AuditedEventType[] = Object.keys(
  AUDITED_EVENT_ACTIONS,
) as AuditedEventType[];

export function auditActionOf(eventType: string): AuditAction | undefined {
  return (AUDITED_EVENT_ACTIONS as Record<string, AuditAction>)[eventType];
}
