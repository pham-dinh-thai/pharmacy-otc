import type { ActorHeaders } from '../../../../shared/types/actor-headers';

export const EMPLOYEE_RESIGNED_EVENT = 'employee.resigned.deactivate_user';

export type EmployeeResignedPayload = {
  employeeId: string;
  userId: string;
  headers: ActorHeaders;
};
