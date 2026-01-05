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
import { AssetStatus, AssetCategory, UserRole } from '../core/models/enums';
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
    { key: 'assetId', label: 'Asset ID', sortable: true, width: '32' },
    { key: 'category', label: 'Category', type: 'badge', sortable: true, tabletHidden: true },
    { key: 'brand', label: 'Brand', sortable: true },
    { key: 'model', label: 'Model', sortable: true, mobileHidden: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true },
    { key: 'location', label: 'Location', mobileHidden: true, format: (item) => item?.locationName || 'Unassigned' },
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
  selectedAsset?: AssetDto;
  assetTimeline: AssetTimelineDto[] = [];
  selectedAssetTimeline: AssetTimelineDto[] = [];
  showFullTimeline: boolean = false;
  
  assetForm: FormGroup;
  assignmentForm: FormGroup;
  searchTerm: string = '';

  assetStatuses = AssetStatus;
  assetCategories = AssetCategory;
  statusKeys = Object.keys(AssetStatus).filter(k => isNaN(Number(k))) as Array<keyof typeof AssetStatus>;
  categoryKeys = Object.keys(AssetCategory).filter(k => isNaN(Number(k))) as Array<keyof typeof AssetCategory>;
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
      brand: ['', Validators.required],
      model: ['', Validators.required],
      serialNumber: [''],
      description: [''],
      purchaseDate: [''],
      purchasePrice: [''],
      warrantyExpiry: [''],
      status: [AssetStatus.Available, Validators.required],
      notes: [''],
      locationId: [null]
    });

    this.assignmentForm = this.fb.group({
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
    if (user) {
      // ITOfficer (2) and Admin (3) can create/edit/delete
      this.canCreate = user.role === UserRole.ITOfficer || user.role === UserRole.Admin;
      this.canEdit = user.role === UserRole.ITOfficer || user.role === UserRole.Admin;
      this.canDelete = user.role === UserRole.Admin; // Only Admin can delete
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
    this.assetForm.patchValue({
      barcode: asset.barcode || '',
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber || '',
      description: asset.description || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchasePrice: asset.purchasePrice || '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      status: asset.status,
      notes: asset.notes || '',
      locationId: asset.location?.id || null
    });
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAsset = undefined;
    this.cdr.markForCheck();
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

  onCreateSubmit(): void {
    if (this.assetForm.valid) {
      const formValue = this.assetForm.value;
      const createRequest = {
        ...formValue,
        purchaseDate: formValue.purchaseDate || undefined,
        purchasePrice: formValue.purchasePrice ? parseFloat(formValue.purchasePrice) : undefined,
        warrantyExpiry: formValue.warrantyExpiry || undefined
      };

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
          } else if (error.error?.message) {
            errorMessage = error.error.message;
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
        description: formValue.description || undefined,
        notes: formValue.notes || undefined
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
      message: `Are you sure you want to delete asset ${asset.assetId}?`,
      subtitle: 'This action cannot be undone.'
    };
    this.showConfirmationModal = true;
    this.cdr.markForCheck();
  }

  onConfirmationConfirmed(): void {
    if (this.assetToDelete) {
      this.assetService.deleteAsset(this.assetToDelete.id).subscribe({
        next: () => {
          this.loadAssets();
          this.alertService.success('Asset Deleted', `Asset ${this.assetToDelete!.assetId} has been successfully deleted.`);
        },
        error: (error) => {
          console.error('Error deleting asset:', error);
          this.alertService.error('Delete Failed', error.error?.message || 'Failed to delete asset. Please try again.');
        }
      });
    }
    this.showConfirmationModal = false;
    this.assetToDelete = undefined;
    this.cdr.markForCheck();
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.assetToDelete = undefined;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.searchRequest.page = page;
    this.loadAssets();
  }

  getStatusClass(status: AssetStatus): string {
    const statusMap: { [key: number]: string } = {
      [AssetStatus.Available]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      [AssetStatus.Assigned]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      [AssetStatus.UnderMaintenance]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      [AssetStatus.Retired]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      [AssetStatus.Lost]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return statusMap[status] || '';
  }

  getCategoryName(category: AssetCategory): string {
    return AssetCategory[category] || 'Other';
  }

  getStatusName(status: AssetStatus): string {
    return AssetStatus[status] || 'Unknown';
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
