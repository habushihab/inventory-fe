import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportService } from '../core/services/report.service';
import { DashboardSummaryDto, AssetsByDepartmentDto } from '../core/models/report.models';
import { AssetDto } from '../core/models/asset.models';
import { AuditLog } from '../core/models/audit.models';
import { AssetCategory } from '../core/models/enums';
import { LayoutComponent } from '../shared/layout/layout.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DatePipe, LayoutComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
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
    private authService: AuthService
  ) {
    const user = this.authService.getUser();
    this.isAdmin = user?.role === 3; // Admin role
  }

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.isLoading = true;
    this.reportService.getDashboardSummary().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard summary:', error);
        this.isLoading = false;
      }
    });
  }

  loadWarrantyExpiring(): void {
    this.isLoading = true;
    this.reportService.getAssetsWithExpiringWarranty(30).subscribe({
      next: (assets) => {
        this.warrantyExpiringAssets = assets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading warranty expiring assets:', error);
        this.isLoading = false;
      }
    });
  }

  loadLostUnassigned(): void {
    this.isLoading = true;
    this.reportService.getLostOrUnassignedAssets().subscribe({
      next: (assets) => {
        this.lostUnassignedAssets = assets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading lost/unassigned assets:', error);
        this.isLoading = false;
      }
    });
  }

  loadAuditLogs(): void {
    if (!this.isAdmin) return;
    
    this.isLoading = true;
    this.reportService.getAuditLogs(undefined, undefined, undefined, undefined, 1, 50).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'warranty') {
      this.loadWarrantyExpiring();
    } else if (tab === 'lost') {
      this.loadLostUnassigned();
    } else if (tab === 'audit' && this.isAdmin) {
      this.loadAuditLogs();
    }
  }

  getCategoryName(category: AssetCategory): string {
    return AssetCategory[category] || 'Other';
  }
}
