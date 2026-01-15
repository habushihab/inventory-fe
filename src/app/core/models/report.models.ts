import { AssetCategory, AssetCondition } from './enums';

export interface DashboardSummaryDto {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  lostAssets: number;
  overdueAssets: number;
  warrantyExpiringAssets: number;
  totalAssetValue: number;
  totalEmployees: number;
  totalLocations: number;
  assetsByFloor: AssetsByFloorDto[];
  assetsByDepartment: AssetsByDepartmentDto[];
  assetsByCategory: AssetsByCategoryDto[];
  assetsByCondition: AssetsByConditionDto[];
  assetsByLocation: AssetsByLocationDto[];
  recentAssignments: RecentAssignmentDto[];
  monthlyTrends: MonthlyTrendDto[];
}

export interface AssetsByFloorDto {
  building: string;
  floor: number;
  count: number;
}

export interface AssetsByDepartmentDto {
  department: string;
  count: number;
}

export interface AssetsByCategoryDto {
  category: AssetCategory;
  count: number;
}

export interface AssetsByConditionDto {
  condition: AssetCondition;
  count: number;
}

export interface AssetsByLocationDto {
  locationId: number;
  locationName: string;
  count: number;
}

export interface RecentAssignmentDto {
  id: number;
  assetName: string;
  employeeName: string;
  locationName?: string;
  assignedDate: string;
  actionType: string;
}

export interface MonthlyTrendDto {
  year: number;
  month: number;
  monthName: string;
  assetsCreated: number;
  assetsAssigned: number;
  assetsReturned: number;
}
