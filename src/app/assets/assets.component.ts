import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssetService } from '../core/services/asset.service';
import { LocationService } from '../core/services/location.service';
import { EmployeeService } from '../core/services/employee.service';
import { AssignmentService } from '../core/services/assignment.service';
import { AuthService } from '../core/services/auth.service';
import { AlertService } from '../core/services/alert.service';
import { ResponsiveService } from '../core/services/responsive.service';
import { AssetDto, AssetSearchRequest, AssetTimelineDto, AssetTimelineType, AssetTimelineStatus } from '../core/models/asset.models';
import { LocationDto } from '../core/models/location.models';
import { EmployeeDto } from '../core/models/employee.models';
import { CreateAssignmentRequest } from '../core/models/assignment.models';
import { AssetStatus, AssetCategory, AssetCondition, UserRole } from '../core/models/enums';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import { ResponsiveTableComponent, TableColumn, TableAction } from '../shared/components/responsive-table/responsive-table.component';
import { decodeJwtToken } from '../core/utils/jwt-helper';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, LayoutComponent, ConfirmationModalComponent, ResponsiveTableComponent],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  // Data properties
  assets: AssetDto[] = [];
  locations: LocationDto[] = [];
  employees: EmployeeDto[] = [];
  
  // Table configuration
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '32' },
    { key: 'category', label: 'Category', type: 'badge', sortable: true, tabletHidden: true },
    { key: 'manufacture', label: 'Manufacture', sortable: true },
    { key: 'model', label: 'Model', sortable: true, mobileHidden: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true },
    { key: 'location', label: 'Location', mobileHidden: true, format: (item) => item?.currentEmployeeLocation || 'Unassigned' },
    { key: 'assignedTo', label: 'Assigned To', mobileHidden: true, tabletHidden: true },
    { key: 'createdAt', label: 'Created', type: 'date', mobileHidden: true, tabletHidden: true }
  ];
  
  tableActions: TableAction[] = [];
  
  // State management
  searchRequest: AssetSearchRequest = { page: 1, pageSize: 20 };
  totalCount: number = 0;
  isLoading: boolean = false;
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showViewModal: boolean = false;
  showAssignModal: boolean = false;
  showNewAssignmentModal: boolean = false;
  selectedAsset?: AssetDto;
  assetTimeline: AssetTimelineDto[] = [];
  selectedAssetTimeline: AssetTimelineDto[] = [];
  showFullTimeline: boolean = false;
  
  assetForm: FormGroup;
  assignmentForm: FormGroup;
  newAssignmentForm: FormGroup;
  searchTerm: string = '';

  availableAssets: AssetDto[] = [];

  assetStatuses = AssetStatus;
  assetCategories = AssetCategory;
  assetConditions = AssetCondition;
  statusKeys = Object.keys(AssetStatus).filter(k => isNaN(Number(k))) as Array<keyof typeof AssetStatus>;
  categoryKeys = Object.keys(AssetCategory).filter(k => isNaN(Number(k))) as Array<keyof typeof AssetCategory>;
  conditionKeys = Object.keys(AssetCondition).filter(k => isNaN(Number(k))) as Array<keyof typeof AssetCondition>;
  Math = Math;

  canCreate: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;

  // Confirmation modal
  showConfirmationModal: boolean = false;
  confirmationData: any = {};
  assetToDelete?: AssetDto;

  constructor(
    private assetService: AssetService,
    private locationService: LocationService,
    private employeeService: EmployeeService,
    private assignmentService: AssignmentService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.assetForm = this.fb.group({
      barcode: [''],
      category: [AssetCategory.Laptop, Validators.required],
      manufacture: ['', Validators.required],
      model: ['', Validators.required],
      serialNumber: [''],
      operatingSystem: [''],
      description: [''],
      purpose: [''],
      purchaseDate: [''],
      purchasePrice: [''],
      warrantyExpiry: [''],
      status: [AssetStatus.Available, Validators.required],
      condition: [AssetCondition.Good, Validators.required]
    });

    this.assignmentForm = this.fb.group({
      employeeId: ['', Validators.required],
      locationId: [''],
      expectedReturnDate: [''],
      notes: ['']
    });

    this.newAssignmentForm = this.fb.group({
      assetId: ['', Validators.required],
      employeeId: ['', Validators.required],
      locationId: [''],
      expectedReturnDate: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadLocations();
    this.loadEmployees();
    this.loadAvailableAssets();
    
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.openCreateModal();
      }
      if (params['searchTerm']) {
        this.searchTerm = params['searchTerm'];
        this.searchRequest.searchTerm = params['searchTerm'];
      }
    });
    
    this.loadAssets();
  }

  checkPermissions(): void {
    const user = this.authService.getUser();
    console.log('🔐 Checking permissions - User:', user);
    
    if (user) {
      console.log('🔐 User role:', user.role, 'Type:', typeof user.role);
      
      // Convert role to number if it's a string
      let roleValue = user.role;
      if (typeof user.role === 'string') {
        // Map string role names to enum values
        const roleMapping: { [key: string]: UserRole } = {
          'Viewer': UserRole.Viewer,
          'ITOfficer': UserRole.ITOfficer,
          'Admin': UserRole.Admin
        };
        roleValue = roleMapping[user.role as string] || UserRole.Viewer;
        console.log('🔐 Mapped string role to enum value:', user.role, '->', roleValue);
      }
      
      console.log('🔐 Role comparison - roleValue === UserRole.Admin:', roleValue === UserRole.Admin);
      console.log('🔐 Role comparison - roleValue === UserRole.ITOfficer:', roleValue === UserRole.ITOfficer);
      
      // ITOfficer (2) and Admin (3) can create/edit/delete
      this.canCreate = roleValue === UserRole.ITOfficer || roleValue === UserRole.Admin;
      this.canEdit = roleValue === UserRole.ITOfficer || roleValue === UserRole.Admin;
      this.canDelete = roleValue === UserRole.Admin; // Only Admin can delete
      
      console.log('🔐 Permissions set - canCreate:', this.canCreate, 'canEdit:', this.canEdit, 'canDelete:', this.canDelete);
    } else {
      console.log('🔐 No user found, setting all permissions to false');
      this.canCreate = false;
      this.canEdit = false;
      this.canDelete = false;
    }
  }

  loadAssets(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.assetService.getAssets(this.searchRequest).subscribe({
      next: (assets) => {
        this.assets = assets;
        this.totalCount = parseInt(localStorage.getItem('X-Total-Count') || '0');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
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

  loadEmployees(): void {
    this.employeeService.getEmployees(undefined, undefined, true).subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  loadAvailableAssets(): void {
    this.assetService.getAssets({ page: 1, pageSize: 1000 }).subscribe({
      next: (assets) => {
        console.log('🔍 All loaded assets for assignment:', assets);
        console.log('🔍 First asset status:', assets[0]?.status, 'Type:', typeof assets[0]?.status);
        
        // Handle both string and enum status values
        this.availableAssets = assets.filter(a => {
          const statusAsString = (a.status as any);
          const isAvailable = statusAsString === 'Available' || statusAsString === AssetStatus.Available || statusAsString === 1;
          console.log('🔍 Asset', a.id, 'status:', a.status, 'statusAsString:', statusAsString, 'isAvailable:', isAvailable);
          return isAvailable;
        });
        
        console.log('✅ Filtered available assets for assignment:', this.availableAssets.length, 'All assets:', assets.length);
        console.log('✅ Available assets for assignment:', this.availableAssets);
      },
      error: (error) => {
        console.error('❌ Error loading available assets:', error);
      }
    });
  }

  onSearch(): void {
    this.searchRequest.searchTerm = this.searchTerm || undefined;
    this.searchRequest.page = 1;
    this.loadAssets();
  }

  onFilterChange(): void {
    this.searchRequest.page = 1;
    this.loadAssets();
  }

  openCreateModal(): void {
    this.assetForm.reset({
      category: AssetCategory.Laptop,
      status: AssetStatus.Available
    });
    this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.cdr.markForCheck();
  }

  openEditModal(asset: AssetDto): void {
    this.selectedAsset = asset;
    console.log('📝 Opening edit modal for asset:', asset);
    console.log('📝 Asset values - category:', asset.category, 'status:', asset.status, 'condition:', asset.condition);
    
    // Create enum mappings for string to number conversion
    const categoryMapping: { [key: string]: AssetCategory } = {
      'Laptop': AssetCategory.Laptop,
      'Monitor': AssetCategory.Monitor,
      'MobilePhone': AssetCategory.MobilePhone,
      'Keyboard': AssetCategory.Keyboard,
      'Mouse': AssetCategory.Mouse,
      'Headset': AssetCategory.Headset,
      'Webcam': AssetCategory.Webcam,
      'Printer': AssetCategory.Printer,
      'Router': AssetCategory.Router,
      'Switch': AssetCategory.Switch,
      'AccessPoint': AssetCategory.AccessPoint,
      'Tablet': AssetCategory.Tablet,
      'Other': AssetCategory.Other
    };
    
    const statusMapping: { [key: string]: AssetStatus } = {
      'Available': AssetStatus.Available,
      'Assigned': AssetStatus.Assigned,
      'UnderMaintenance': AssetStatus.UnderMaintenance,
      'Retired': AssetStatus.Retired,
      'Lost': AssetStatus.Lost
    };
    
    const conditionMapping: { [key: string]: AssetCondition } = {
      'VeryBad': AssetCondition.VeryBad,
      'Bad': AssetCondition.Bad,
      'Low': AssetCondition.Low,
      'Good': AssetCondition.Good,
      'VeryGood': AssetCondition.VeryGood,
      'New': AssetCondition.New
    };
    
    // Convert enum values from strings to numbers if needed
    const categoryValue = typeof asset.category === 'string' ? 
      categoryMapping[asset.category as string] || AssetCategory.Laptop : asset.category;
    const statusValue = typeof asset.status === 'string' ? 
      statusMapping[asset.status as string] || AssetStatus.Available : asset.status;
    const conditionValue = typeof asset.condition === 'string' ? 
      conditionMapping[asset.condition as string] || AssetCondition.Good : asset.condition;
    
    this.assetForm.patchValue({
      barcode: asset.barcode || '',
      category: categoryValue,
      manufacture: asset.manufacture,
      model: asset.model,
      serialNumber: asset.serialNumber || '',
      operatingSystem: asset.operatingSystem || '',
      description: asset.description || '',
      purpose: asset.purpose || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchasePrice: asset.purchasePrice || '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      status: statusValue,
      condition: conditionValue
    });
    
    console.log('📝 Form values after patch:', this.assetForm.value);
    console.log('📝 Converted values - category:', categoryValue, 'status:', statusValue, 'condition:', conditionValue);
    
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAsset = undefined;
    this.cdr.markForCheck();
  }

  onUnassign(asset: AssetDto): void {
    if (asset.currentAssignment) {
      this.assignmentService.returnAssignment(asset.currentAssignment.id, {}).subscribe({
        next: () => {
          this.loadAssets();
          this.alertService.success('Asset Unassigned', 'The asset has been successfully unassigned.');
        },
        error: (error: any) => {
          console.error('Error unassigning asset:', error);
          this.alertService.error('Unassign Failed', 'Failed to unassign asset. Please try again.');
        }
      });
    }
  }

  openViewModal(asset: AssetDto): void {
    this.selectedAsset = asset;
    this.showViewModal = true;
    this.cdr.markForCheck();
    // Load timeline data
    this.loadAssetTimeline(asset.id);
  }

  loadAssetTimeline(assetId: number): void {
    this.assetService.getAssetTimeline(assetId).subscribe({
      next: (timeline) => {
        this.selectedAssetTimeline = timeline;
        this.showFullTimeline = false; // Reset to show limited view
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading asset timeline:', error);
        this.selectedAssetTimeline = [];
        this.cdr.markForCheck();
      }
    });
  }

  toggleTimelineView(): void {
    this.showFullTimeline = !this.showFullTimeline;
    this.cdr.markForCheck();
  }

  getDisplayedTimeline(): AssetTimelineDto[] {
    if (this.showFullTimeline || this.selectedAssetTimeline.length <= 4) {
      return this.selectedAssetTimeline;
    }
    return this.selectedAssetTimeline.slice(0, 4);
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedAsset = undefined;
    this.cdr.markForCheck();
  }

  openAssignModal(asset: AssetDto): void {
    this.selectedAsset = asset;
    this.assignmentForm.reset({
      employeeId: '',
      locationId: '',
      expectedReturnDate: '',
      notes: ''
    });
    this.showAssignModal = true;
    this.cdr.markForCheck();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedAsset = undefined;
    this.cdr.markForCheck();
  }

  onAssignSubmit(): void {
    if (this.assignmentForm.valid && this.selectedAsset) {
      const formValue = this.assignmentForm.value;
      const assignmentRequest: CreateAssignmentRequest = {
        assetId: this.selectedAsset.id,
        employeeId: parseInt(formValue.employeeId),
        locationId: formValue.locationId ? parseInt(formValue.locationId) : undefined,
        expectedReturnDate: formValue.expectedReturnDate || undefined,
        notes: formValue.notes || undefined
      };

      this.assignmentService.createAssignment(assignmentRequest).subscribe({
        next: () => {
          this.closeAssignModal();
          this.loadAssets(); // Refresh the assets list
          this.alertService.success('Asset Assigned', 'The asset has been successfully assigned to the employee.');
          if (this.showViewModal) {
            this.loadAssetTimeline(this.selectedAsset!.id); // Refresh timeline if view modal is open
          }
        },
        error: (error) => {
          console.error('Error creating assignment:', error);
          this.alertService.error('Assignment Failed', error.error?.message || 'Failed to assign asset. Please try again.');
        }
      });
    }
  }

  openNewAssignmentModal(asset?: AssetDto): void {
    this.newAssignmentForm.reset();
    if (asset) {
      // Pre-select the asset if provided
      this.newAssignmentForm.patchValue({ assetId: asset.id });
    }
    this.showNewAssignmentModal = true;
    this.loadAvailableAssets(); // Load available assets when modal opens
    this.cdr.markForCheck();
  }

  closeNewAssignmentModal(): void {
    this.showNewAssignmentModal = false;
    this.cdr.markForCheck();
  }

  onNewAssignmentSubmit(): void {
    if (this.newAssignmentForm.valid) {
      const formValue = this.newAssignmentForm.value;
      const assignmentRequest: CreateAssignmentRequest = {
        assetId: parseInt(formValue.assetId),
        employeeId: parseInt(formValue.employeeId),
        locationId: formValue.locationId ? parseInt(formValue.locationId) : undefined,
        expectedReturnDate: formValue.expectedReturnDate || undefined,
        notes: formValue.notes || undefined
      };

      this.assignmentService.createAssignment(assignmentRequest).subscribe({
        next: () => {
          this.closeNewAssignmentModal();
          this.loadAssets(); // Refresh the assets list
          this.loadAvailableAssets(); // Refresh available assets
          this.alertService.success('Assignment Created', 'The asset has been successfully assigned to the employee.');
        },
        error: (error) => {
          console.error('Error creating assignment:', error);
          this.alertService.error('Assignment Failed', error.error?.message || 'Failed to create assignment. Please try again.');
        }
      });
    }
  }

  onUnassignAsset(asset: AssetDto): void {
    if (!asset.currentAssignment) {
      this.alertService.error('Unassign Failed', 'This asset is not currently assigned.');
      return;
    }

    this.confirmationData = {
      title: 'Unassign Asset',
      message: `Are you sure you want to unassign "${asset.manufacture} ${asset.model}" from ${asset.currentAssignment.employeeName}?`,
      confirmText: 'Unassign',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      action: 'unassign',
      data: asset.currentAssignment.id
    };
    this.showConfirmationModal = true;
  }

  onCreateSubmit(): void {
    if (this.assetForm.valid) {
      const formValue = this.assetForm.value;
      const createRequest = {
        ...formValue,
        purchaseDate: formValue.purchaseDate || undefined,
        purchasePrice: formValue.purchasePrice ? parseFloat(formValue.purchasePrice) : undefined,
        warrantyExpiry: formValue.warrantyExpiry || undefined
      };

      console.log('📤 Sending create request:', JSON.stringify(createRequest, null, 2));

      // Debug: Log user info before request
      const user = this.authService.getUser();
      const token = this.authService.getToken();
      
      // Decode token to see actual claims
      let tokenClaims = null;
      if (token) {
        tokenClaims = decodeJwtToken(token);
        console.log('🔍 JWT Token Claims:', tokenClaims);
        console.log('🔍 Role claim in token:', tokenClaims?.role);
        console.log('🔍 All claims:', Object.keys(tokenClaims || {}));
      }
      
      console.log('📝 Creating asset - User info:', {
        user: user,
        role: user?.role,
        roleType: typeof user?.role,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        tokenClaims: tokenClaims,
        roleClaimValue: tokenClaims?.role,
        roleClaimType: typeof tokenClaims?.role
      });

      this.assetService.createAsset(createRequest).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadAssets();
          this.alertService.success('Asset Created', 'The asset has been successfully created.');
        },
        error: (error) => {
          console.error('❌ Error creating asset:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            headers: error.headers,
            url: error.url
          });
          
          let errorMessage = 'Failed to create asset';
          
          if (error.status === 403) {
            const user = this.authService.getUser();
            errorMessage = `403 Forbidden - You are logged in as ${user?.email} with role ${user?.role} (${UserRole[user?.role || 0]}). The backend may require a different role or the token may not be valid.`;
          } else if (error.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (error.status === 400 && error.error?.errors) {
            // Handle FluentValidation errors - they come as an object with field names as keys
            const validationErrors = error.error.errors;
            const errorMessages = Object.keys(validationErrors).map(field => {
              const fieldErrors = validationErrors[field];
              return `${field}: ${Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}`;
            });
            errorMessage = 'Validation failed:\n' + errorMessages.join('\n');
            console.error('Validation errors:', validationErrors);
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.title) {
            errorMessage = error.error.title;
          }
          
          this.alertService.error('Asset Creation Failed', errorMessage);
        }
      });
    }
  }

  onEditSubmit(): void {
    if (this.assetForm.valid && this.selectedAsset) {
      const formValue = this.assetForm.value;
      const updateRequest = {
        ...formValue,
        purchaseDate: formValue.purchaseDate || undefined,
        purchasePrice: formValue.purchasePrice ? parseFloat(formValue.purchasePrice) : undefined,
        warrantyExpiry: formValue.warrantyExpiry || undefined,
        barcode: formValue.barcode || undefined,
        serialNumber: formValue.serialNumber || undefined,
        description: formValue.description || undefined
      };

      this.assetService.updateAsset(this.selectedAsset.id, updateRequest).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadAssets();
          this.alertService.success('Asset Updated', 'The asset has been successfully updated.');
        },
        error: (error) => {
          console.error('Error updating asset:', error);
          this.alertService.error('Update Failed', error.error?.message || 'Failed to update asset. Please try again.');
        }
      });
    }
  }

  onDelete(asset: AssetDto): void {
    this.assetToDelete = asset;
    this.confirmationData = {
      type: 'danger' as const,
      title: 'Delete Asset',
      message: `Are you sure you want to delete asset ${asset.manufacture} ${asset.model} (ID: ${asset.id})?`,
      subtitle: 'This action cannot be undone.',
      action: 'delete'
    };
    this.showConfirmationModal = true;
    this.cdr.markForCheck();
  }

  onConfirmationConfirmed(): void {
    if (this.confirmationData.action === 'delete' && this.assetToDelete) {
      this.assetService.deleteAsset(this.assetToDelete.id).subscribe({
        next: () => {
          this.loadAssets();
          this.alertService.success('Asset Deleted', `Asset ${this.assetToDelete!.manufacture} ${this.assetToDelete!.model} has been successfully deleted.`);
        },
        error: (error) => {
          console.error('Error deleting asset:', error);
          this.alertService.error('Delete Failed', error.error?.message || 'Failed to delete asset. Please try again.');
        }
      });
    } else if (this.confirmationData.action === 'unassign') {
      const assignmentId = this.confirmationData.data;
      this.assignmentService.returnAssignment(assignmentId, {}).subscribe({
        next: () => {
          this.loadAssets();
          this.alertService.success('Asset Unassigned', 'The asset has been successfully unassigned.');
        },
        error: (error: any) => {
          console.error('Error unassigning asset:', error);
          this.alertService.error('Unassign Failed', error.error?.message || 'Failed to unassign asset. Please try again.');
        }
      });
    }
    this.showConfirmationModal = false;
    this.assetToDelete = undefined;
    this.confirmationData = {};
    this.cdr.markForCheck();
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.assetToDelete = undefined;
    this.confirmationData = {};
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.searchRequest.page = page;
    this.loadAssets();
  }

  getStatusClass(status: AssetStatus | string): string {
    // Handle string values from API
    if (typeof status === 'string') {
      const stringStatusMap: { [key: string]: string } = {
        'Available': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        'Assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        'UnderMaintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        'Retired': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        'Lost': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      };
      return stringStatusMap[status] || 'bg-gray-100 text-gray-800';
    }
    
    // Handle enum values
    const statusMap: { [key: number]: string } = {
      [AssetStatus.Available]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      [AssetStatus.Assigned]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      [AssetStatus.UnderMaintenance]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      [AssetStatus.Retired]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      [AssetStatus.Lost]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return statusMap[status] || '';
  }

  getCategoryName(category: AssetCategory | string): string {
    if (typeof category === 'string') {
      return category; // Return the string directly if it's already a string
    }
    return AssetCategory[category] || 'Other';
  }

  getStatusName(status: AssetStatus | string): string {
    if (typeof status === 'string') {
      return status; // Return the string directly if it's already a string
    }
    return AssetStatus[status] || 'Unknown';
  }

  getConditionName(condition: AssetCondition | string): string {
    if (typeof condition === 'string') {
      return condition; // Return the string directly if it's already a string
    }
    return AssetCondition[condition] || 'Unknown';
  }

  isAssetAvailable(asset: AssetDto): boolean {
    const status = asset.status as any;
    return status === 'Available' || status === AssetStatus.Available || status === 1;
  }

  isAssetAssigned(asset: AssetDto): boolean {
    const status = asset.status as any;
    return status === 'Assigned' || status === AssetStatus.Assigned || status === 2;
  }

  getConditionClass(condition: AssetCondition): string {
    const conditionMap: { [key: number]: string } = {
      [AssetCondition.New]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      [AssetCondition.VeryGood]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      [AssetCondition.Good]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      [AssetCondition.Low]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      [AssetCondition.Bad]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      [AssetCondition.VeryBad]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return conditionMap[condition] || '';
  }

  getTimelineStatusClass(status: AssetTimelineStatus): string {
    const statusMap: { [key: number]: string } = {
      [AssetTimelineStatus.Completed]: 'bg-slate-400',
      [AssetTimelineStatus.InProgress]: 'bg-primary',
      [AssetTimelineStatus.Pending]: 'bg-amber-500',
      [AssetTimelineStatus.Warning]: 'bg-yellow-500',
      [AssetTimelineStatus.Error]: 'bg-red-500'
    };
    return statusMap[status] || 'bg-slate-400';
  }

  getTimelineTypeIcon(type: AssetTimelineType): string {
    const iconMap: { [key: number]: string } = {
      [AssetTimelineType.Created]: 'add_circle',
      [AssetTimelineType.Assigned]: 'person_add',
      [AssetTimelineType.Returned]: 'person_remove',
      [AssetTimelineType.Maintenance]: 'build',
      [AssetTimelineType.StatusChanged]: 'swap_horiz',
      [AssetTimelineType.LocationChanged]: 'location_on',
      [AssetTimelineType.Updated]: 'edit',
      [AssetTimelineType.SupportTicket]: 'support',
      [AssetTimelineType.Deleted]: 'delete'
    };
    return iconMap[type] || 'info';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  getCategoryIcon(category: AssetCategory): string {
    const iconMap: { [key: number]: string } = {
      [AssetCategory.Laptop]: 'laptop_mac',
      [AssetCategory.Monitor]: 'desktop_windows',
      [AssetCategory.MobilePhone]: 'smartphone',
      [AssetCategory.Keyboard]: 'keyboard',
      [AssetCategory.Mouse]: 'mouse',
      [AssetCategory.Headset]: 'headphones',
      [AssetCategory.Webcam]: 'videocam',
      [AssetCategory.Printer]: 'print',
      [AssetCategory.Router]: 'router',
      [AssetCategory.Switch]: 'hub',
      [AssetCategory.AccessPoint]: 'wifi',
      [AssetCategory.Tablet]: 'tablet',
      [AssetCategory.Other]: 'devices'
    };
    return iconMap[category] || 'devices';
  }

  getEmployeeInitials(fullName: string): string {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }

  isWarrantyValid(warrantyExpiry: string): boolean {
    if (!warrantyExpiry) return false;
    const expiryDate = new Date(warrantyExpiry);
    const now = new Date();
    return expiryDate > now;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
