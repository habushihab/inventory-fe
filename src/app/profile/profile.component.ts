import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';
import { AlertService } from '../core/services/alert.service';
import { UpdateUserRequest } from '../core/models/user.models';
import { UserDto } from '../core/models/auth.models';
import { UserRole } from '../core/models/enums';
import { LayoutComponent } from '../shared/layout/layout.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LayoutComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: UserDto | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditingProfile = false;
  isChangingPassword = false;
  isLoading = false;

  userRoles = UserRole;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const user = this.authService.getUser();
    if (user) {
      this.currentUser = user;
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || ''
      });
    }
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  getRoleName(): string {
    if (!this.currentUser) return 'User';
    const role = this.currentUser.role as unknown as string | number;
    switch (role) {
      case UserRole.Admin:
      case 'Admin':
        return 'Administrator';
      case UserRole.ITOfficer:
      case 'ITOfficer':
        return 'IT Officer';
      case UserRole.Viewer:
      case 'Viewer':
        return 'Viewer';
      default:
        return 'User';
    }
  }

  getRoleBadgeClass(): string {
    if (!this.currentUser) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    const role = this.currentUser.role as unknown as string | number;
    switch (role) {
      case UserRole.Admin:
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case UserRole.ITOfficer:
      case 'ITOfficer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case UserRole.Viewer:
      case 'Viewer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }

  getRoleIcon(): string {
    if (!this.currentUser) return 'visibility';
    const role = this.currentUser.role as unknown as string | number;
    switch (role) {
      case UserRole.Admin:
      case 'Admin':
        return 'admin_panel_settings';
      case UserRole.ITOfficer:
      case 'ITOfficer':
        return 'engineering';
      case UserRole.Viewer:
      case 'Viewer':
        return 'visibility';
      default:
        return 'person';
    }
  }

  toggleEditProfile(): void {
    if (this.isEditingProfile) {
      // Cancel editing - reset form
      this.loadCurrentUser();
    }
    this.isEditingProfile = !this.isEditingProfile;
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;
      const formValue = this.profileForm.value;
      const updateRequest: UpdateUserRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber || undefined,
        role: this.currentUser.role
      };

      this.userService.updateUser(this.currentUser.id, updateRequest).subscribe({
        next: (updatedUser) => {
          // Since the backend returns void, manually update the user object
          if (this.currentUser) {
            this.currentUser = {
              ...this.currentUser,
              firstName: updateRequest.firstName,
              lastName: updateRequest.lastName,
              email: updateRequest.email,
              phoneNumber: updateRequest.phoneNumber,
              fullName: `${updateRequest.firstName} ${updateRequest.lastName}`
            };
          }
          this.isEditingProfile = false;
          this.isLoading = false;
          this.alertService.success('Profile Updated', 'Your profile has been successfully updated.');
          
          // Update the user in auth service
          if (this.currentUser) {
            this.authService.updateCurrentUser(this.currentUser);
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading = false;
          this.alertService.error('Update Failed', error.error?.message || 'Failed to update profile. Please try again.');
        }
      });
    }
  }

  toggleChangePassword(): void {
    if (this.isChangingPassword) {
      this.passwordForm.reset();
    }
    this.isChangingPassword = !this.isChangingPassword;
  }

  onChangePassword(): void {
    if (this.passwordForm.valid && this.currentUser) {
      this.isLoading = true;
      const formValue = this.passwordForm.value;

      this.userService.changePassword(this.currentUser.id, {
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword
      }).subscribe({
        next: () => {
          this.passwordForm.reset();
          this.isChangingPassword = false;
          this.isLoading = false;
          this.alertService.success('Password Changed', 'Your password has been successfully updated.');
        },
        error: (error: any) => {
          console.error('Error changing password:', error);
          this.isLoading = false;
          this.alertService.error('Password Change Failed', error.error?.message || 'Failed to change password. Please try again.');
        }
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}