import { AssetCategory } from './enums';

export interface DashboardSummaryDto {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  overdueAssets: number;
  warrantyExpiringAssets: number;
  assetsByFloor: AssetsByFloorDto[];
  assetsByDepartment: AssetsByDepartmentDto[];
  assetsByCategory: AssetsByCategoryDto[];
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

export interface MonthlyTrendDto {
  year: number;
  month: number;
  monthName: string;
  assetsCreated: number;
  assetsAssigned: number;
  assetsReturned: number;
}

