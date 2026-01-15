import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { AlertService } from '../core/services/alert.service';
import { AuthService } from '../core/services/auth.service';
import { UserDto, CreateUserRequest, UpdateUserRequest } from '../core/models/user.models';
import { PaginatedUsers } from '../core/services/user.service';
import { UserRole } from '../core/models/enums';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ConfirmationModalComponent, ConfirmationData } from '../shared/confirmation-modal/confirmation-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LayoutComponent, ConfirmationModalComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  users: UserDto[] = [];
  searchTerm: string = '';
  roleFilter: UserRole | null = null;
  isActiveFilter: boolean | null = null;
  page: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  isLoading: boolean = false;
  showCreateModal: boolean = false;
  showEditModal: boolean = false;
  showPasswordResetModal: boolean = false;
  selectedUser?: UserDto;
  
  // Confirmation modal
  showConfirmationModal: boolean = false;
  confirmationData?: ConfirmationData;
  pendingAction?: () => void;
  
  userForm: FormGroup;
  passwordResetForm: FormGroup;
  Math = Math;

  userRoles = UserRole;
  roleKeys = Object.keys(UserRole).filter(k => isNaN(Number(k))) as Array<keyof typeof UserRole>;

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: [UserRole.Viewer, Validators.required],
      department: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.passwordResetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['action'] === 'create') {
          this.openCreateModal();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers({
      search: this.searchTerm || undefined,
      role: this.roleFilter || undefined,
      isActive: this.isActiveFilter ?? undefined,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (result: PaginatedUsers) => {
        this.users = result.users;
        this.totalCount = result.totalCount;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.alertService.error('Loading Failed', 'Failed to load users. Please try again.');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadUsers();
  }

  openCreateModal(): void {
    this.userForm.reset({
      role: UserRole.Viewer
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.cdr.detectChanges();
  }

  openEditModal(user: UserDto): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = undefined;
    this.cdr.detectChanges();
  }

  openPasswordResetModal(user: UserDto): void {
    console.log('Opening password reset modal for user:', user.fullName);
    this.selectedUser = user;
    this.passwordResetForm.reset();
    this.showPasswordResetModal = true;
    console.log('showPasswordResetModal set to:', this.showPasswordResetModal);
    this.cdr.detectChanges();
  }

  closePasswordResetModal(): void {
    this.showPasswordResetModal = false;
    this.selectedUser = undefined;
    this.cdr.detectChanges();
  }

  onCreateSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const createRequest: CreateUserRequest = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        role: formValue.role,
        department: formValue.department || undefined,
        password: formValue.password
      };

      this.userService.createUser(createRequest).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadUsers();
          this.alertService.success('User Created', 'The user has been successfully created.');
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.alertService.error('Creation Failed', error.error?.message || 'Failed to create user. Please try again.');
        }
      });
    }
  }

  onEditSubmit(): void {
    if (this.userForm.valid && this.selectedUser) {
      const formValue = this.userForm.value;
      const updateRequest: UpdateUserRequest = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        role: formValue.role,
        department: formValue.department || undefined
      };

      this.userService.updateUser(this.selectedUser.id, updateRequest).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadUsers();
          this.alertService.success('User Updated', 'The user has been successfully updated.');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.alertService.error('Update Failed', error.error?.message || 'Failed to update user. Please try again.');
        }
      });
    }
  }

  onPasswordResetSubmit(): void {
    if (this.passwordResetForm.valid && this.selectedUser) {
      const newPassword = this.passwordResetForm.value.newPassword;
      
      this.userService.resetUserPassword(this.selectedUser.id, newPassword).subscribe({
        next: () => {
          this.closePasswordResetModal();
          this.alertService.success('Password Reset', 'The user password has been reset successfully.');
        },
        error: (error) => {
          console.error('Error resetting password:', error);
          this.alertService.error('Reset Failed', error.error?.message || 'Failed to reset password. Please try again.');
        }
      });
    }
  }

  onToggleStatus(user: UserDto): void {
    console.log('Toggling status for user:', user.fullName);
    const action = user.isActive ? 'deactivate' : 'activate';
    const actionTitle = user.isActive ? 'Deactivate User' : 'Activate User';
    const actionMessage = user.isActive 
      ? `Are you sure you want to deactivate ${user.fullName}? They will no longer be able to access the system.`
      : `Are you sure you want to activate ${user.fullName}? They will be able to access the system again.`;

    this.confirmationData = {
      title: actionTitle,
      message: actionMessage,
      confirmText: action === 'deactivate' ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      type: action === 'deactivate' ? 'danger' : 'info'
    };

    this.pendingAction = () => {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => {
          this.loadUsers();
          const successMessage = user.isActive 
            ? `${user.fullName} has been deactivated.`
            : `${user.fullName} has been activated.`;
          this.alertService.success('Status Updated', successMessage);
        },
        error: (error: any) => {
          console.error('Error toggling user status:', error);
          this.alertService.error('Status Update Failed', error.error?.message || `Failed to ${action} user. Please try again.`);
        }
      });
    };

    this.showConfirmationModal = true;
    console.log('showConfirmationModal set to:', this.showConfirmationModal);
    this.cdr.detectChanges();
  }

  onConfirmationConfirmed(): void {
    this.showConfirmationModal = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = undefined;
    }
    this.cdr.detectChanges();
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.pendingAction = undefined;
    this.confirmationData = undefined;
    this.cdr.detectChanges();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadUsers();
  }

  getRoleName(role: UserRole): string {
    return UserRole[role] || 'Unknown';
  }

  getRoleClass(role: UserRole): string {
    const roleMap: { [key: number]: string } = {
      [UserRole.Viewer]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      [UserRole.ITOfficer]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      [UserRole.Admin]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return roleMap[role] || '';
  }

  getUserInitials(user: UserDto): string {
    return user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase();
  }

  canEditUser(user: UserDto): boolean {
    const currentUser = this.authService.getUser();
    return currentUser?.id !== user.id; // Can't edit own account
  }
}