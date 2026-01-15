import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ReportService } from '../core/services/report.service';
import { PermissionsService } from '../core/services/permissions.service';
import { DashboardSummaryDto, MonthlyTrendDto, AssetsByLocationDto, RecentAssignmentDto } from '../core/models/report.models';
import { AssetCategory } from '../core/models/enums';
import { UserDto } from '../core/models/auth.models';
import { LayoutComponent } from '../shared/layout/layout.component';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Data properties
  dashboardData?: DashboardSummaryDto;
  currentUser?: UserDto;

  // Loading state
  isLoading = true;

  // Chart view state
  chartView: 'department' | 'category' = 'category';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly cdr: ChangeDetectorRef,
    public readonly permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    const user = this.authService.getUser();
    this.currentUser = user || undefined;
  }

  private loadDashboardData(): void {
    this.reportService.getDashboardSummary()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data: DashboardSummaryDto) => {
          this.dashboardData = data;
        },
        error: (error: any) => {
          console.error('Error loading dashboard data:', error);
        }
      });
  }

  onAssignAsset(): void {
    this.router.navigate(['/assignments'], { queryParams: { action: 'create' } });
  }

  onAddNewAsset(): void {
    this.router.navigate(['/assets'], { queryParams: { action: 'create' } });
  }

  onViewReport(): void {
    this.router.navigate(['/reports']);
  }

  onViewAllActivity(): void {
    this.router.navigate(['/assignments']);
  }

  // Basic getters
  getTotalAssets(): number {
    return this.dashboardData?.totalAssets || 0;
  }

  getAvailableAssets(): number {
    return this.dashboardData?.availableAssets || 0;
  }

  getAssignedAssets(): number {
    return this.dashboardData?.assignedAssets || 0;
  }

  getMaintenanceAssets(): number {
    return this.dashboardData?.maintenanceAssets || 0;
  }

  getLostAssets(): number {
    return this.dashboardData?.lostAssets || 0;
  }

  getUtilizationRate(): number {
    if (!this.dashboardData || this.dashboardData.totalAssets === 0) return 0;
    return Math.round((this.dashboardData.assignedAssets / this.dashboardData.totalAssets) * 100);
  }

  getPendingReturns(): number {
    return this.dashboardData?.overdueAssets || 0;
  }

  getWarrantyExpiringAssets(): number {
    return this.dashboardData?.warrantyExpiringAssets || 0;
  }

  getTotalAssetValue(): number {
    return this.dashboardData?.totalAssetValue || 0;
  }

  getTotalEmployees(): number {
    return this.dashboardData?.totalEmployees || 0;
  }

  getTotalLocations(): number {
    return this.dashboardData?.totalLocations || 0;
  }

  // Format currency
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M' + ' JOD';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K' + ' JOD';
    }
    return value.toFixed(0) + ' JOD';
  }

  // Chart data getters
  getAssetValuationByDepartment(): any[] {
    return this.dashboardData?.assetsByDepartment || [];
  }

  getAssetsByCategory(): any[] {
    return this.dashboardData?.assetsByCategory || [];
  }

  getAssetsByLocation(): AssetsByLocationDto[] {
    return this.dashboardData?.assetsByLocation || [];
  }

  getRecentAssignments(): RecentAssignmentDto[] {
    return this.dashboardData?.recentAssignments || [];
  }

  getMonthlyTrends(): MonthlyTrendDto[] {
    return this.dashboardData?.monthlyTrends || [];
  }

  // Chart helper methods
  setChartView(view: 'department' | 'category'): void {
    this.chartView = view;
    this.cdr.markForCheck();
  }

  getCurrentChartData(): any[] {
    return this.chartView === 'department'
      ? this.getAssetValuationByDepartment()
      : this.getAssetsByCategory();
  }

  getMaxChartValue(): number {
    const data = this.getCurrentChartData();
    if (data.length === 0) return 100;
    const max = Math.max(...data.map(item => item.count));
    return Math.ceil(max / 10) * 10 || 10;
  }

  getChartItemHeight(count: number): number {
    const max = this.getMaxChartValue();
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  getChartItemLabel(item: any): string {
    let label: string;
    if (item.department) {
      label = item.department;
    } else if (item.category !== undefined) {
      // Convert category enum to readable name
      label = AssetCategory[item.category] || 'Other';
    } else {
      label = 'Unknown';
    }
    return label.length > 10 ? label.substring(0, 10) + '...' : label;
  }

  // Monthly trends chart helper
  getTrendBarHeight(value: number): number {
    const trends = this.getMonthlyTrends();
    if (trends.length === 0) return 0;

    const maxValue = Math.max(
      ...trends.map(t => Math.max(t.assetsCreated, t.assetsAssigned, t.assetsReturned))
    );

    if (maxValue === 0) return 0;
    return Math.max(4, (value / maxValue) * 40); // Min 4px, max 40px per bar
  }

  // Location bar helper
  getLocationBarWidth(count: number): number {
    const locations = this.getAssetsByLocation();
    if (locations.length === 0) return 0;
    const maxCount = Math.max(...locations.map(l => l.count));
    if (maxCount === 0) return 0;
    return (count / maxCount) * 100;
  }

  // Time formatting
  formatTimeAgo(date: string): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityDate.toLocaleDateString();
  }

  // Math helper for template
  Math = Math;
}
