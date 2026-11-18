export type EmployeeStatus = 'working' | 'pregnant' | 'resigned';

export const EMPLOYEE_POSITIONS = [
  'Nhân viên',
  'Trưởng phòng',
  'Quản lý',
  'Dược sĩ',
  'Thực tập sinh',
] as const;

export type EmployeePosition = (typeof EMPLOYEE_POSITIONS)[number];

export function isEmployeePosition(value: string): value is EmployeePosition {
  return (EMPLOYEE_POSITIONS as readonly string[]).includes(value);
}

export type Employee = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: EmployeePosition | null;
  status: EmployeeStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmployeePage = {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
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
