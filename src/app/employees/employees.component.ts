import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../core/services/employee.service';
import { LocationService } from '../core/services/location.service';
import { AlertService } from '../core/services/alert.service';
import { EmployeeDto, CreateEmployeeRequest } from '../core/models/employee.models';
import { LocationDto } from '../core/models/location.models';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, LayoutComponent, ConfirmationModalComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
  employees: EmployeeDto[] = [];
  locations: LocationDto[] = [];
  searchTerm: string = '';
  departmentFilter: string = '';
  isActiveFilter: boolean | null = null;
  page: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  isLoading: boolean = false;
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showViewModal: boolean = false;
  selectedEmployee?: EmployeeDto;
  
  // Confirmation modal
  showConfirmationModal: boolean = false;
  confirmationData: any = {};
  employeeToDeactivate?: EmployeeDto;
  
  // Reactivation confirmation
  showReactivationModal: boolean = false;
  reactivationData: any = {};
  employeeToReactivate?: EmployeeDto;
  
  employeeForm: FormGroup;
  Math = Math;

  constructor(
    private employeeService: EmployeeService,
    private locationService: LocationService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.employeeForm = this.fb.group({
      employeeId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      department: ['', Validators.required],
      workLocationId: [null],
      jobTitle: [''],
      manager: [''],
      startDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadLocations();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.openCreateModal();
      }
      if (params['search']) {
        this.searchTerm = params['search'];
      }
    });
    
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees(
      this.searchTerm || undefined,
      this.departmentFilter || undefined,
      this.isActiveFilter ?? undefined,
      this.page,
      this.pageSize
    ).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.totalCount = parseInt(localStorage.getItem('X-Total-Count') || '0');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.isLoading = false;
      }
    });
  }

  loadLocations(): void {
    this.locationService.getLocations(undefined, undefined, true).subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadEmployees();
  }

  openCreateModal(): void {
    this.employeeForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openEditModal(employee: EmployeeDto): void {
    this.selectedEmployee = employee;
    this.employeeForm.patchValue({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber || '',
      department: employee.department,
      workLocationId: employee.workLocation?.id || null,
      jobTitle: employee.jobTitle || '',
      manager: employee.manager || '',
      startDate: employee.startDate ? employee.startDate.split('T')[0] : ''
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedEmployee = undefined;
  }

  openViewModal(employee: EmployeeDto): void {
    this.selectedEmployee = employee;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedEmployee = undefined;
  }

  onCreateSubmit(): void {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;
      const createRequest: CreateEmployeeRequest = {
        ...formValue,
        startDate: formValue.startDate || undefined
      };

      this.employeeService.createEmployee(createRequest).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadEmployees();
          this.alertService.success('Employee Created', 'Employee has been successfully created.');
        },
        error: (error) => {
          console.error('Error creating employee:', error);
          this.alertService.error('Creation Failed', error.error?.message || 'Failed to create employee. Please try again.');
        }
      });
    }
  }

  onEditSubmit(): void {
    if (this.employeeForm.valid && this.selectedEmployee) {
      const formValue = this.employeeForm.value;
      const updateRequest: CreateEmployeeRequest = {
        ...formValue,
        startDate: formValue.startDate || undefined
      };

      this.employeeService.updateEmployee(this.selectedEmployee.id, updateRequest).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadEmployees();
          this.alertService.success('Employee Updated', 'Employee has been successfully updated.');
        },
        error: (error) => {
          console.error('Error updating employee:', error);
          this.alertService.error('Update Failed', error.error?.message || 'Failed to update employee. Please try again.');
        }
      });
    }
  }

  onDeactivate(employee: EmployeeDto): void {
    this.employeeToDeactivate = employee;
    this.confirmationData = {
      type: 'warning' as const,
      title: 'Deactivate Employee',
      message: `Are you sure you want to deactivate ${employee.fullName}?`,
      subtitle: 'They will no longer be able to access the system or be assigned assets.'
    };
    this.showConfirmationModal = true;
  }

  onConfirmationConfirmed(): void {
    if (this.employeeToDeactivate) {
      this.employeeService.deactivateEmployee(this.employeeToDeactivate.id).subscribe({
        next: () => {
          this.loadEmployees();
          this.alertService.success('Employee Deactivated', `${this.employeeToDeactivate!.fullName} has been successfully deactivated.`);
          
          // Ask if they want to reactivate
          this.showReactivationPrompt(this.employeeToDeactivate!);
        },
        error: (error) => {
          console.error('Error deactivating employee:', error);
          this.alertService.error('Deactivation Failed', error.error?.message || 'Failed to deactivate employee. Please try again.');
        }
      });
    }
    this.showConfirmationModal = false;
    this.employeeToDeactivate = undefined;
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.employeeToDeactivate = undefined;
  }

  showReactivationPrompt(employee: EmployeeDto): void {
    this.employeeToReactivate = employee;
    this.reactivationData = {
      type: 'info' as const,
      title: 'Reactivate Employee',
      message: `Would you like to reactivate ${employee.fullName} immediately?`,
      subtitle: 'This will restore their access to the system.'
    };
    this.showReactivationModal = true;
  }

  onReactivationConfirmed(): void {
    if (this.employeeToReactivate) {
      this.employeeService.activateEmployee(this.employeeToReactivate.id).subscribe({
        next: () => {
          this.loadEmployees();
          this.alertService.success('Employee Reactivated', `${this.employeeToReactivate!.fullName} has been successfully reactivated.`);
        },
        error: (error) => {
          console.error('Error reactivating employee:', error);
          this.alertService.error('Reactivation Failed', error.error?.message || 'Failed to reactivate employee. Please try again.');
        }
      });
    }
    this.showReactivationModal = false;
    this.employeeToReactivate = undefined;
  }

  onReactivationCancelled(): void {
    this.showReactivationModal = false;
    this.employeeToReactivate = undefined;
  }

  onActivate(employee: EmployeeDto): void {
    this.employeeToReactivate = employee;
    this.reactivationData = {
      type: 'info' as const,
      title: 'Activate Employee',
      message: `Are you sure you want to activate ${employee.fullName}?`,
      subtitle: 'This will restore their access to the system.'
    };
    this.showReactivationModal = true;
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadEmployees();
  }
}
