import { LocationDto } from './location.models';

export interface AssignmentDto {
  id: number;
  assetId: number;
  assetName: string;
  employeeId: number;
  employeeName: string;
  location?: LocationDto;
  assignedDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
  returnNotes?: string;
  isActive: boolean;
  isOverdue: boolean;
  daysAssigned?: number;
}

export interface CreateAssignmentRequest {
  assetId: number;
  employeeId: number;
  locationId?: number;
  expectedReturnDate?: string;
  notes?: string;
}

export interface ReturnAssignmentRequest {
  actualReturnDate?: string;
  returnNotes?: string;
}

