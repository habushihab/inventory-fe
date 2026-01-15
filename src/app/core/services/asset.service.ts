import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssetDto, CreateAssetRequest, UpdateAssetRequest, AssetSearchRequest, AssetTimelineDto } from '../models/asset.models';
import { AssignmentDto } from '../models/assignment.models';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/assets`;

  getAssets(request?: AssetSearchRequest): Observable<AssetDto[]> {
    let params = new HttpParams();
    
    if (request) {
      if (request.searchTerm) params = params.set('searchTerm', request.searchTerm);
      if (request.category) params = params.set('category', request.category.toString());
      if (request.status) params = params.set('status', request.status.toString());
      if (request.manufacture) params = params.set('manufacture', request.manufacture);
      if (request.employeeId) params = params.set('employeeId', request.employeeId.toString());
      if (request.hasWarrantyExpiring) params = params.set('hasWarrantyExpiring', request.hasWarrantyExpiring.toString());
      params = params.set('page', (request.page || 1).toString());
      params = params.set('pageSize', (request.pageSize || 20).toString());
    }

    return this.http.get<AssetDto[]>(this.apiUrl, { params });
  }

  getAsset(id: number): Observable<AssetDto> {
    return this.http.get<AssetDto>(`${this.apiUrl}/${id}`);
  }

  createAsset(asset: CreateAssetRequest): Observable<AssetDto> {
    return this.http.post<AssetDto>(this.apiUrl, asset);
  }

  updateAsset(id: number, asset: UpdateAssetRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, asset);
  }

  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAssetHistory(id: number): Observable<AssignmentDto[]> {
    return this.http.get<AssignmentDto[]>(`${this.apiUrl}/${id}/history`);
  }

  getAssetTimeline(id: number): Observable<AssetTimelineDto[]> {
    return this.http.get<AssetTimelineDto[]>(`${this.apiUrl}/${id}/timeline`);
  }
}

