import { AssetStatus, AssetCategory } from './enums';
import { LocationDto } from './location.models';
import { AssignmentDto } from './assignment.models';
import { EmployeeDto } from './employee.models';

export interface AssetDto {
  id: number;
  assetId: string;
  barcode?: string;
  qrCode?: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  notes?: string;
  location?: LocationDto;
  currentAssignment?: AssignmentDto;  // Changed from currentHolder to match backend
  createdAt: string;
  updatedAt: string;
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
  assetId: string;
  barcode?: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status?: AssetStatus;
  notes?: string;
  locationId?: number;
}

export interface UpdateAssetRequest {
  barcode?: string;
  category?: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status?: AssetStatus;
  notes?: string;
  locationId?: number;
}

export interface AssetSearchRequest {
  searchTerm?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  brand?: string;
  locationId?: number;
  employeeId?: number;
  hasWarrantyExpiring?: boolean;
  page?: number;
  pageSize?: number;
}

