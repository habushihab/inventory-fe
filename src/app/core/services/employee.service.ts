import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeDto, CreateEmployeeRequest } from '../models/employee.models';
import { AssignmentDto } from '../models/assignment.models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  getEmployees(search?: string, department?: string, isActive?: boolean, page: number = 1, pageSize: number = 20): Observable<EmployeeDto[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (department) params = params.set('department', department);
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<EmployeeDto[]>(this.apiUrl, { params });
  }

  getEmployee(id: number): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: CreateEmployeeRequest): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: CreateEmployeeRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employee);
  }

  deactivateEmployee(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateEmployee(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activate`, {});
  }

  getEmployeeAssignments(id: number, activeOnly: boolean = false): Observable<AssignmentDto[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<AssignmentDto[]>(`${this.apiUrl}/${id}/assignments`, { params });
  }
}

