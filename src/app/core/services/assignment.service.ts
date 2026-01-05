import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignmentDto, CreateAssignmentRequest, ReturnAssignmentRequest } from '../models/assignment.models';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/assignments`;

  getAssignments(
    isActive?: boolean,
    isOverdue?: boolean,
    assetId?: number,
    employeeId?: number,
    page: number = 1,
    pageSize: number = 20
  ): Observable<AssignmentDto[]> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    if (isOverdue !== undefined) params = params.set('isOverdue', isOverdue.toString());
    if (assetId) params = params.set('assetId', assetId.toString());
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<AssignmentDto[]>(this.apiUrl, { params });
  }

  getAssignment(id: number): Observable<AssignmentDto> {
    return this.http.get<AssignmentDto>(`${this.apiUrl}/${id}`);
  }

  createAssignment(assignment: CreateAssignmentRequest): Observable<AssignmentDto> {
    return this.http.post<AssignmentDto>(this.apiUrl, assignment);
  }

  updateAssignment(id: number, assignment: CreateAssignmentRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, assignment);
  }

  returnAssignment(id: number, request: ReturnAssignmentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/return`, request);
  }

  getOverdueAssignments(): Observable<AssignmentDto[]> {
    return this.http.get<AssignmentDto[]>(`${this.apiUrl}/overdue`);
  }
}

