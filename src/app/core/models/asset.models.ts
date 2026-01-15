import { AssetStatus, AssetCategory, AssetCondition } from './enums';
import { LocationDto } from './location.models';
import { AssignmentDto } from './assignment.models';
import { EmployeeDto } from './employee.models';

export interface AssetDto {
  id: number;
  barcode?: string;
  category: AssetCategory;
  manufacture: string;
  model: string;
  serialNumber?: string;
  operatingSystem?: string;
  description?: string;
  purpose?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  condition: AssetCondition;
  warrantyStatus: string;
  warrantyMonthsRemaining?: number;
  currentEmployeeTitle?: string;
  currentEmployeeDepartment?: string;
  currentEmployeeLocation?: string;
  currentAssignment?: AssignmentDto;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AssetTimelineDto {
  id: number;
  type: AssetTimelineType;
  title: string;
  description: string;
  timestamp: string;
  userName?: string;
  userAvatar?: string;
  status: AssetTimelineStatus;
  additionalInfo?: string;
  ticketNumber?: string;
  employee?: EmployeeDto;
  location?: LocationDto;
}

export enum AssetTimelineType {
  Created = 1,
  Assigned = 2,
  Returned = 3,
  Maintenance = 4,
  StatusChanged = 5,
  LocationChanged = 6,
  Updated = 7,
  SupportTicket = 8,
  Deleted = 9
}

export enum AssetTimelineStatus {
  Completed = 1,
  InProgress = 2,
  Pending = 3,
  Warning = 4,
  Error = 5
}

export interface CreateAssetRequest {
  barcode?: string;
  category: AssetCategory;
  manufacture: string;
  model: string;
  serialNumber?: string;
  operatingSystem?: string;
  description?: string;
  purpose?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  condition: AssetCondition;
}

export interface UpdateAssetRequest {
  barcode?: string;
  category?: AssetCategory;
  manufacture?: string;
  model?: string;
  serialNumber?: string;
  operatingSystem?: string;
  description?: string;
  purpose?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
}

export interface AssetSearchRequest {
  searchTerm?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  condition?: AssetCondition;
  manufacture?: string;
  employeeId?: number;
  hasWarrantyExpiring?: boolean;
  page?: number;
  pageSize?: number;
}

