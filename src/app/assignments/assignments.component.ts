import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../core/services/assignment.service';
import { AssetService } from '../core/services/asset.service';
import { EmployeeService } from '../core/services/employee.service';
import { LocationService } from '../core/services/location.service';
import { AlertService } from '../core/services/alert.service';
import { PermissionsService } from '../core/services/permissions.service';
import { AssignmentDto, CreateAssignmentRequest, ReturnAssignmentRequest } from '../core/models/assignment.models';
import { AssetDto } from '../core/models/asset.models';
import { AssetStatus } from '../core/models/enums';
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
  
  private _showReturnModal: boolean = false;
  get showReturnModal(): boolean {
    return this._showReturnModal;
  }
  set showReturnModal(value: boolean) {
    console.log('📋 showReturnModal changing from', this._showReturnModal, 'to', value);
    console.trace('📋 showReturnModal stack trace');
    this._showReturnModal = value;
  }
  
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
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public permissions: PermissionsService
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
        console.log('📋 Loaded assignments:', assignments.length);
        console.log('📋 Assignment details:', assignments);
        this.totalCount = parseInt(localStorage.getItem('X-Total-Count') || '0');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading assignments:', error);
        this.isLoading = false;
      }
    });
  }

  loadAssets(): void {
    this.assetService.getAssets({ page: 1, pageSize: 1000 }).subscribe({
      next: (assets) => {
        console.log('🔍 All loaded assets:', assets);
        console.log('🔍 First asset status:', assets[0]?.status, 'Type:', typeof assets[0]?.status);
        
        // Handle both string and enum status values
        this.assets = assets.filter(a => {
          const statusAsString = (a.status as any);
          const isAvailable = statusAsString === 'Available' || statusAsString === AssetStatus.Available || statusAsString === 1;
          console.log('🔍 Asset', a.id, 'status:', a.status, 'statusAsString:', statusAsString, 'isAvailable:', isAvailable);
          return isAvailable;
        });
        
        console.log('✅ Filtered available assets:', this.assets.length, 'Total assets:', assets.length);
        console.log('✅ Available assets:', this.assets);
      },
      error: (error) => {
        console.error('❌ Error loading assets:', error);
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
    console.log('➕ Opening create assignment modal');
    this.assignmentForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  confirmUnassignAsset(assignment: AssignmentDto): void {
      this.openReturnModal(assignment);
  }

  openReturnModal(assignment: AssignmentDto): void {
    try {
      console.log('🔄 Opening return modal for assignment:', assignment);
      console.log('🔄 Before - Modal state:', this.showReturnModal);
      
      this.selectedAssignment = assignment;
      this.returnForm.reset({
        actualReturnDate: new Date().toISOString().split('T')[0]
      });
      
      console.log('🔄 Return form valid after reset:', this.returnForm.valid);
      console.log('🔄 Return form value after reset:', this.returnForm.value);
      
      console.log('🔄 Setting modal to true...');
      this.showReturnModal = true;
      
      console.log('🔄 After - Modal state:', this.showReturnModal);
      console.log('🔄 Selected assignment:', this.selectedAssignment);
      
      // Force multiple change detection cycles
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        console.log('🔄 Timeout check - Modal state:', this.showReturnModal);
        console.log('🔄 DOM element exists:', document.querySelector('[style*="position: absolute"]'));
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in openReturnModal:', error);
    }
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
    console.log('🚨 onReturnSubmit called!');
    console.log('🚨 Form valid:', this.returnForm.valid);
    console.log('🚨 Form value:', this.returnForm.value);
    console.log('🚨 Selected assignment:', this.selectedAssignment);
    
    if (this.returnForm.valid && this.selectedAssignment) {
      const formValue = this.returnForm.value;
      const returnRequest: ReturnAssignmentRequest = {
        actualReturnDate: formValue.actualReturnDate || undefined,
        returnNotes: formValue.returnNotes || undefined
      };

      console.log('🚨 Making return request:', returnRequest);
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
    } else {
      console.log('🚨 Form invalid or no selected assignment - not submitting');
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
