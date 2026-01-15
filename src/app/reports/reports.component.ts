import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportService } from '../core/services/report.service';
import { DashboardSummaryDto } from '../core/models/report.models';
import { AssetDto } from '../core/models/asset.models';
import { AssetStatus, AssetCategory, AssetCondition, AuditAction } from '../core/models/enums';
import { AuditLog } from '../core/models/audit.models';
import { LayoutComponent } from '../shared/layout/layout.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DatePipe, LayoutComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  dashboardData?: DashboardSummaryDto;
  warrantyExpiringAssets: AssetDto[] = [];
  lostUnassignedAssets: AssetDto[] = [];
  auditLogs: AuditLog[] = [];
  isLoading: boolean = false;
  activeTab: string = 'summary';
  isAdmin: boolean = false;
  Math = Math;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const user = this.authService.getUser();
    const role = user?.role as unknown as string | number;
    this.isAdmin = role === 3 || role === 'Admin';
  }

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.reportService.getDashboardSummary().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading dashboard summary:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadWarrantyExpiring(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.reportService.getAssetsWithExpiringWarranty(30).subscribe({
      next: (assets) => {
        this.warrantyExpiringAssets = assets;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading warranty expiring assets:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadLostUnassigned(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.reportService.getLostOrUnassignedAssets().subscribe({
      next: (assets) => {
        this.lostUnassignedAssets = assets;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading lost/unassigned assets:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAuditLogs(): void {
    if (!this.isAdmin) return;

    this.isLoading = true;
    this.cdr.markForCheck();
    this.reportService.getAuditLogs(undefined, undefined, undefined, undefined, 1, 50).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'summary' || tab === 'category' || tab === 'condition') {
      if (!this.dashboardData) {
        this.loadDashboardSummary();
      }
    } else if (tab === 'warranty') {
      this.loadWarrantyExpiring();
    } else if (tab === 'lost') {
      this.loadLostUnassigned();
    } else if (tab === 'audit' && this.isAdmin) {
      this.loadAuditLogs();
    }
    this.cdr.markForCheck();
  }

  // Category helpers
  getCategoryName(category: AssetCategory | string): string {
    // Handle string values from API
    if (typeof category === 'string') {
      return category;
    }
    
    // Handle numeric enum values
    const names: Record<number, string> = {
      1: 'Laptop',
      2: 'Monitor',
      3: 'Mobile Phone',
      4: 'Keyboard',
      5: 'Mouse',
      6: 'Headset',
      7: 'Webcam',
      8: 'Printer',
      9: 'Router',
      10: 'Switch',
      11: 'Access Point',
      12: 'Tablet',
      99: 'Other'
    };
    return names[category] || 'Other';
  }

  // Condition helpers
  getConditionName(condition: AssetCondition | string): string {
    // Handle string values from API
    if (typeof condition === 'string') {
      return condition;
    }
    
    // Handle numeric enum values
    const names: Record<number, string> = {
      1: 'Very Bad',
      2: 'Bad', 
      3: 'Low',
      4: 'Good',
      5: 'Very Good',
      6: 'New'
    };
    return names[condition] || 'Unknown';
  }

  getConditionIcon(condition: AssetCondition | string): string {
    // Handle string values from API
    if (typeof condition === 'string') {
      const stringIcons: Record<string, string> = {
        'Very Bad': 'dangerous',
        'Bad': 'warning', 
        'Low': 'remove_circle',
        'Good': 'check_circle',
        'Very Good': 'verified',
        'New': 'new_releases'
      };
      return stringIcons[condition] || 'help';
    }
    
    // Handle numeric enum values
    const icons: Record<number, string> = {
      1: 'dangerous',
      2: 'warning',
      3: 'remove_circle',
      4: 'check_circle',
      5: 'verified',
      6: 'new_releases'
    };
    return icons[condition] || 'help';
  }

  getConditionColorClass(condition: AssetCondition | string): string {
    // Handle string values from API
    if (typeof condition === 'string') {
      const stringColors: Record<string, string> = {
        'Very Bad': 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        'Bad': 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        'Low': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
        'Good': 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        'Very Good': 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        'New': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      };
      return stringColors[condition] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
    
    // Handle numeric enum values
    const colors: Record<number, string> = {
      1: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      2: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      3: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      4: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      5: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      6: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    };
    return colors[condition] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }

  // Status helpers
  getStatusName(status: AssetStatus): string {
    const names: Record<number, string> = {
      1: 'Available',
      2: 'Assigned',
      3: 'Under Maintenance',
      4: 'Retired',
      5: 'Lost'
    };
    return names[status as number] || 'Unknown';
  }

  getStatusClass(status: AssetStatus): string {
    const classes: Record<number, string> = {
      1: 'bg-green-100 text-green-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-yellow-100 text-yellow-700',
      4: 'bg-slate-100 text-slate-700',
      5: 'bg-red-100 text-red-700'
    };
    return classes[status as number] || 'bg-slate-100 text-slate-700';
  }

  // Chart helpers
  getBarHeight(count: number, data: any[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data.map(d => d.count));
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  // Currency formatter
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M' + ' JOD';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K' + ' JOD';
    }
    return value.toFixed(0) + ' JOD';
  }

  // Warranty helpers
  getDaysLeft(warrantyExpiry: string | Date | undefined): number {
    if (!warrantyExpiry) return 0;
    const expiry = new Date(warrantyExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysLeftClass(warrantyExpiry: string | Date | undefined): string {
    const days = this.getDaysLeft(warrantyExpiry);
    if (days <= 7) return 'bg-red-100 text-red-700';
    if (days <= 14) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  }

  // Audit log helpers
  getActionClass(action: AuditAction): string {
    const classes: Record<number, string> = {
      [AuditAction.Created]: 'bg-green-100 text-green-700',
      [AuditAction.Updated]: 'bg-blue-100 text-blue-700',
      [AuditAction.Assigned]: 'bg-purple-100 text-purple-700',
      [AuditAction.Unassigned]: 'bg-orange-100 text-orange-700',
      [AuditAction.StatusChanged]: 'bg-yellow-100 text-yellow-700',
      [AuditAction.LocationChanged]: 'bg-cyan-100 text-cyan-700',
      [AuditAction.Deleted]: 'bg-red-100 text-red-700'
    };
    return classes[action] || 'bg-slate-100 text-slate-700';
  }

  getActionName(action: AuditAction): string {
    return AuditAction[action] || 'Unknown';
  }
}
