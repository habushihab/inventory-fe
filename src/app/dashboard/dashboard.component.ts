import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ReportService } from '../core/services/report.service';
import { AssignmentService } from '../core/services/assignment.service';
import { DashboardSummaryDto } from '../core/models/report.models';
import { AssignmentDto } from '../core/models/assignment.models';
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
  recentActivities: AssignmentDto[] = [];
  currentUser?: UserDto;
  
  // Loading state
  isLoading = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly assignmentService: AssignmentService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.loadDashboardData();
    this.loadRecentActivities();
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

  private loadRecentActivities(): void {
    this.assignmentService.getAssignments(true, undefined, undefined, undefined, 1, 5)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (assignments: AssignmentDto[]) => {
          this.recentActivities = assignments;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading recent activities:', error);
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

  getTotalAssets(): number {
    return this.dashboardData?.totalAssets || 0;
  }

  getUtilizationRate(): number {
    if (!this.dashboardData || this.dashboardData.totalAssets === 0) return 0;
    return Math.round((this.dashboardData.assignedAssets / this.dashboardData.totalAssets) * 100);
  }

  getPendingReturns(): number {
    return this.dashboardData?.overdueAssets || 0;
  }

  getLowStockAlerts(): number {
    return this.dashboardData?.warrantyExpiringAssets || 0;
  }

  getAssetValuationByDepartment(): any[] {
    return this.dashboardData?.assetsByDepartment || [];
  }

  formatTimeAgo(date: string): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}m ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}h ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}d ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}
