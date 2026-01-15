import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationService } from '../core/services/location.service';
import { LocationDto, CreateLocationRequest } from '../core/models/location.models';
import { AlertService } from '../core/services/alert.service';
import { PermissionsService } from '../core/services/permissions.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ConfirmationModalComponent, ConfirmationData } from '../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LayoutComponent, ConfirmationModalComponent],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss'
})
export class LocationsComponent implements OnInit {
  locations: LocationDto[] = [];
  buildingFilter: string = '';
  floorFilter: number | null = null;
  isActiveFilter: boolean | null = null;
  isLoading: boolean = false;
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  selectedLocation?: LocationDto;
  
  // Confirmation modal
  showConfirmationModal: boolean = false;
  confirmationData?: ConfirmationData;
  pendingAction?: () => void;
  
  locationForm: FormGroup;

  constructor(
    private locationService: LocationService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public permissions: PermissionsService
  ) {
    this.locationForm = this.fb.group({
      building: ['', Validators.required],
      floor: ['', [Validators.required, Validators.min(0)]],
      room: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.openCreateModal();
      }
      if (params['search']) {
        this.buildingFilter = params['search'];
      }
    });
    
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading = true;
    this.locationService.getLocations(
      this.buildingFilter || undefined,
      this.floorFilter || undefined,
      this.isActiveFilter ?? undefined
    ).subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadLocations();
  }

  openCreateModal(): void {
    this.locationForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openEditModal(location: LocationDto): void {
    this.selectedLocation = location;
    this.locationForm.patchValue({
      building: location.building,
      floor: location.floor,
      room: location.room || '',
      description: location.description || ''
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedLocation = undefined;
  }

  onCreateSubmit(): void {
    if (this.locationForm.valid) {
      this.locationService.createLocation(this.locationForm.value).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadLocations();
          this.alertService.success('Location Created', 'The location has been successfully created.');
        },
        error: (error) => {
          console.error('Error creating location:', error);
          this.alertService.error('Creation Failed', error.error?.message || 'Failed to create location. Please try again.');
        }
      });
    }
  }

  onEditSubmit(): void {
    if (this.locationForm.valid && this.selectedLocation) {
      this.locationService.updateLocation(this.selectedLocation.id, this.locationForm.value).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadLocations();
          this.alertService.success('Location Updated', 'The location has been successfully updated.');
        },
        error: (error) => {
          console.error('Error updating location:', error);
          this.alertService.error('Update Failed', error.error?.message || 'Failed to update location. Please try again.');
        }
      });
    }
  }

  onDeactivate(location: LocationDto): void {
    this.confirmationData = {
      title: 'Deactivate Location',
      message: `Are you sure you want to deactivate ${location.fullLocation}? This location will no longer be available for asset assignments.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      type: 'warning'
    };

    this.pendingAction = () => {
      this.locationService.deactivateLocation(location.id).subscribe({
        next: () => {
          this.loadLocations();
          this.alertService.success('Location Deactivated', `${location.fullLocation} has been deactivated.`);
        },
        error: (error) => {
          console.error('Error deactivating location:', error);
          this.alertService.error('Deactivation Failed', error.error?.message || 'Failed to deactivate location. Please try again.');
        }
      });
    };

    this.showConfirmationModal = true;
  }

  onConfirmationConfirmed(): void {
    this.showConfirmationModal = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = undefined;
    }
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.pendingAction = undefined;
    this.confirmationData = undefined;
  }

  onActivate(location: LocationDto): void {
    this.confirmationData = {
      title: 'Activate Location',
      message: `Are you sure you want to activate ${location.fullLocation}? This location will be available for asset assignments.`,
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'info'
    };

    this.pendingAction = () => {
      this.locationService.activateLocation(location.id).subscribe({
        next: () => {
          this.loadLocations();
          this.alertService.success('Location Activated', `${location.fullLocation} has been activated.`);
        },
        error: (error) => {
          console.error('Error activating location:', error);
          this.alertService.error('Activation Failed', error.error?.message || 'Failed to activate location. Please try again.');
        }
      });
    };

    this.showConfirmationModal = true;
  }
}
