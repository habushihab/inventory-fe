import { LocationDto } from './location.models';

export interface EmployeeDto {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  department: string;
  jobTitle?: string;
  manager?: string;
  workLocation?: LocationDto;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface CreateEmployeeRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department: string;
  workLocationId?: number;
  jobTitle?: string;
  manager?: string;
  startDate?: string;
}

