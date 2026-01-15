import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from '../models/enums';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(private authService: AuthService) {}

  private getUserRole(): string | number | null {
    const user = this.authService.getUser();
    return user?.role ?? null;
  }

  private isViewer(): boolean {
    const role = this.getUserRole();
    return role === UserRole.Viewer || role === 'Viewer';
  }

  private isITOfficer(): boolean {
    const role = this.getUserRole();
    return role === UserRole.ITOfficer || role === 'ITOfficer';
  }

  private isAdmin(): boolean {
    const role = this.getUserRole();
    return role === UserRole.Admin || role === 'Admin';
  }

  // General permissions
  canCreate(): boolean {
    return !this.isViewer();
  }

  canEdit(): boolean {
    return !this.isViewer();
  }

  canDelete(): boolean {
    return !this.isViewer();
  }

  canAssign(): boolean {
    return !this.isViewer();
  }

  canDeactivate(): boolean {
    return !this.isViewer();
  }

  // Asset-specific permissions
  canCreateAsset(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canEditAsset(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canDeleteAsset(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canAssignAsset(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  // Employee-specific permissions
  canCreateEmployee(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canEditEmployee(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canDeactivateEmployee(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  // Location-specific permissions
  canCreateLocation(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canEditLocation(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canDeactivateLocation(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  // Assignment-specific permissions
  canCreateAssignment(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  canReturnAsset(): boolean {
    return this.isITOfficer() || this.isAdmin();
  }

  // User management permissions
  canManageUsers(): boolean {
    return this.isAdmin();
  }
}
