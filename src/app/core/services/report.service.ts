import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummaryDto } from '../models/report.models';
import { AssetDto } from '../models/asset.models';
import { AuditLog } from '../models/audit.models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getDashboardSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${this.apiUrl}/dashboard`);
  }

  getAssetsWithExpiringWarranty(days: number = 30): Observable<AssetDto[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<AssetDto[]>(`${this.apiUrl}/assets/warranty-expiring`, { params });
  }

  getLostOrUnassignedAssets(): Observable<AssetDto[]> {
    return this.http.get<AssetDto[]>(`${this.apiUrl}/assets/lost-unassigned`);
  }

  getAuditLogs(
    assetId?: number,
    employeeId?: number,
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    pageSize: number = 50
  ): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (assetId) params = params.set('assetId', assetId.toString());
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate) params = params.set('toDate', toDate.toISOString());
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, { params });
  }
}

