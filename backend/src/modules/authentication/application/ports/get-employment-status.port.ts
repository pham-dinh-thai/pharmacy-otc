import { EmployeeStatus } from '../../../employees/domain/enums/employee-status.enum';

export const GET_EMPLOYMENT_STATUS_PORT = 'GET_EMPLOYMENT_STATUS_PORT';

export interface IGetEmploymentStatusPort {
  execute(userId: string): Promise<EmployeeStatus | null>;
}
