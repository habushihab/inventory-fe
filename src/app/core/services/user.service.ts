import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto, CreateUserRequest, UpdateUserRequest, UserSearchRequest } from '../models/user.models';

export interface PaginatedUsers {
  users: UserDto[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(request: UserSearchRequest = {}): Observable<PaginatedUsers> {
    let params = new HttpParams();
    
    if (request.search) params = params.set('search', request.search);
    if (request.role !== undefined) params = params.set('role', request.role.toString());
    if (request.isActive !== undefined) params = params.set('isActive', request.isActive.toString());
    if (request.page) params = params.set('page', request.page.toString());
    if (request.pageSize) params = params.set('pageSize', request.pageSize.toString());

    return this.http.get<UserDto[]>(this.apiUrl, { 
      params, 
      observe: 'response' 
    }).pipe(
      map((response: HttpResponse<UserDto[]>) => ({
        users: response.body || [],
        totalCount: parseInt(response.headers.get('X-Total-Count') || '0')
      }))
    );
  }

  getUser(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, user);
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, user);
  }

  toggleUserStatus(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  resetUserPassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reset-password`, { newPassword });
  }

  changePassword(id: string, request: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, request);
  }
}