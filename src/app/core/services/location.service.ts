import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LocationDto, CreateLocationRequest } from '../models/location.models';
import { AssetDto } from '../models/asset.models';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/locations`;

  getLocations(building?: string, floor?: number, isActive?: boolean): Observable<LocationDto[]> {
    let params = new HttpParams();
    if (building) params = params.set('building', building);
    if (floor) params = params.set('floor', floor.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<LocationDto[]>(this.apiUrl, { params });
  }

  getLocation(id: number): Observable<LocationDto> {
    return this.http.get<LocationDto>(`${this.apiUrl}/${id}`);
  }

  createLocation(location: CreateLocationRequest): Observable<LocationDto> {
    return this.http.post<LocationDto>(this.apiUrl, location);
  }

  updateLocation(id: number, location: CreateLocationRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, location);
  }

  deactivateLocation(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateLocation(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activate`, {});
  }

  getLocationAssets(id: number): Observable<AssetDto[]> {
    return this.http.get<AssetDto[]>(`${this.apiUrl}/${id}/assets`);
  }
}

