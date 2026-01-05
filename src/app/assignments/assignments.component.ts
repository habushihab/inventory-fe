import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../core/services/assignment.service';
import { AssetService } from '../core/services/asset.service';
import { EmployeeService } from '../core/services/employee.service';
import { LocationService } from '../core/services/location.service';
import { AlertService } from '../core/services/alert.service';
import { AssignmentDto, CreateAssignmentRequest, ReturnAssignmentRequest } from '../core/models/assignment.models';
import { AssetDto } from '../core/models/asset.models';
import { EmployeeDto } from '../core/models/employee.models';
import { LocationDto } from '../core/models/location.models';
import { LayoutComponent } from '../shared/layout/layout.component';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, LayoutComponent],
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.scss'
})
export class AssignmentsComponent implements OnInit {
  assignments: AssignmentDto[] = [];
  assets: AssetDto[] = [];
  employees: EmployeeDto[] = [];
  locations: LocationDto[] = [];
  isActiveFilter: boolean | null = true;
  isOverdueFilter: boolean | null = null;
  page: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  isLoading: boolean = false;
  showCreateModal: boolean = false;
  showReturnModal: boolean = false;
  selectedAssignment?: AssignmentDto;
  
  assignmentForm: FormGroup;
  returnForm: FormGroup;
  Math = Math;

  constructor(
    private assignmentService: AssignmentService,
    private assetService: AssetService,
    private employeeService: EmployeeService,
    private locationService: LocationService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.assignmentForm = this.fb.group({
      assetId: ['', Validators.required],
      employeeId: ['', Validators.required],
      locationId: [null],
      expectedReturnDate: [''],
      notes: ['']
    });

    this.returnForm = this.fb.group({
      actualReturnDate: [''],
      returnNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAssets();
    this.loadEmployees();
    this.loadLocations();
    this.loadAssignments();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.openCreateModal();
      }
    });
  }

  loadAssignments(): void {
    this.isLoading = true;
    this.assignmentService.getAssignments(
      this.isActiveFilter ?? undefined,
      this.isOverdueFilter ?? undefined,
      undefined,
      undefined,
      this.page,
      this.pageSize
    ).subscribe({
      next: (assignments) => {
        this.assignments = assignments;
        this.totalCount = parseInt(localStorage.getItem('X-Total-Count') || '0');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.isLoading = false;
      }
    });
  }

  loadAssets(): void {
    this.assetService.getAssets({ page: 1, pageSize: 1000, status: 1 }).subscribe({
      next: (assets) => {
        this.assets = assets.filter(a => a.status === 1); // Only available assets
      },
      error: (error) => {
        console.error('Error loading assets:', error);
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(undefined, undefined, true, 1, 1000).subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
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

  onFilterChange(): void {
    this.page = 1;
    this.loadAssignments();
  }

  openCreateModal(): void {
    this.assignmentForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openReturnModal(assignment: AssignmentDto): void {
    this.selectedAssignment = assignment;
    this.returnForm.reset({
      actualReturnDate: new Date().toISOString().split('T')[0]
    });
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    this.showReturnModal = false;
    this.selectedAssignment = undefined;
  }

  onCreateSubmit(): void {
    if (this.assignmentForm.valid) {
      const formValue = this.assignmentForm.value;
      const createRequest: CreateAssignmentRequest = {
        ...formValue,
        expectedReturnDate: formValue.expectedReturnDate || undefined
      };

      this.assignmentService.createAssignment(createRequest).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadAssignments();
          this.loadAssets(); // Refresh available assets
          this.alertService.success('Assignment Created', 'The asset has been successfully assigned to the employee.');
        },
        error: (error) => {
          console.error('Error creating assignment:', error);
          this.alertService.error('Assignment Failed', error.error?.message || 'Failed to create assignment. Please try again.');
        }
      });
    }
  }

  onReturnSubmit(): void {
    if (this.returnForm.valid && this.selectedAssignment) {
      const formValue = this.returnForm.value;
      const returnRequest: ReturnAssignmentRequest = {
        actualReturnDate: formValue.actualReturnDate || undefined,
        returnNotes: formValue.returnNotes || undefined
      };

      this.assignmentService.returnAssignment(this.selectedAssignment.id, returnRequest).subscribe({
        next: () => {
          this.closeReturnModal();
          this.loadAssignments();
          this.loadAssets(); // Refresh available assets
          this.alertService.success('Asset Returned', 'The asset has been successfully returned.');
        },
        error: (error) => {
          console.error('Error returning assignment:', error);
          this.alertService.error('Return Failed', error.error?.message || 'Failed to return assignment. Please try again.');
        }
      });
    }
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadAssignments();
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
