export type EmployeeStatus = 'working' | 'pregnant' | 'resigned';

export type Employee = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string | null;
  status: EmployeeStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeDepartmentOption = {
  id: string;
  name: string;
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  working: 'Đang làm việc',
  pregnant: 'Đang mang thai',
  resigned: 'Đã nghỉ việc',
};

export const MANAGEABLE_EMPLOYEE_STATUSES: readonly EmployeeStatus[] = [
  'working',
  'pregnant',
];
