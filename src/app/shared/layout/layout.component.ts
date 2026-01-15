import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserDto } from '../../core/models/auth.models';
import { UserRole } from '../../core/models/enums';
import { AlertsComponent } from '../alerts/alerts.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, AlertsComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit, OnDestroy {
  @Input() currentRoute: string = '';
  
  private readonly destroy$ = new Subject<void>();
  
  // UI State
  sidebarOpen = false;
  userDropdownOpen = false;
  searchTerm = '';
  
  // Data
  currentUser?: UserDto;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.initializeUser();
  }

  ngOnInit(): void {
    this.setupRouteTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    const user = this.authService.getUser();
    this.currentUser = user || undefined;
  }

  private setupRouteTracking(): void {
    // Get current route from router if not provided as input
    if (!this.currentRoute) {
      this.currentRoute = this.router.url;
    }
    
    // Update current route on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.cdr.markForCheck();
      });
  }

  onSearch(): void {
    const trimmedSearchTerm = this.searchTerm?.trim();
    if (!trimmedSearchTerm) {
      return;
    }

    // Navigate based on current route
    const routeMap: Record<string, string> = {
      '/assets': '/assets',
      '/employees': '/employees', 
      '/locations': '/locations',
      '/assignments': '/assignments'
    };

    const targetRoute = routeMap[this.currentRoute] || '/assets';
    this.router.navigate([targetRoute], { 
      queryParams: { search: trimmedSearchTerm },
      queryParamsHandling: 'merge'
    });
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.markForCheck();
  }

  closeSidebar(): void {
    if (this.sidebarOpen) {
      this.sidebarOpen = false;
      this.cdr.markForCheck();
    }
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
    this.cdr.markForCheck();
  }

  closeUserDropdown(): void {
    if (this.userDropdownOpen) {
      this.userDropdownOpen = false;
      this.cdr.markForCheck();
    }
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

  getSearchPlaceholder(): string {
    const currentPath = this.currentRoute.split('?')[0];
    switch (currentPath) {
      case '/employees':
        return 'Search employees by name, email, or ID...';
      case '/locations':
        return 'Search locations by building name...';
      case '/assignments':
        return 'Search assignments...';
      default:
        return 'Search assets by ID, brand, model, or serial number...';
    }
  }

  // Role-based access control
  canAccessPage(page: string): boolean {
    if (!this.currentUser) return false;
    const role = this.currentUser.role as unknown as string | number;
    
    switch (page) {
      case 'admin':
        // Only Admins can access user management
        return role === UserRole.Admin || role === 'Admin';
      case 'reports':
        // IT Officers and Admins can access reports
        return role === UserRole.Admin || role === 'Admin' ||
               role === UserRole.ITOfficer || role === 'ITOfficer';
      case 'dashboard':
      case 'assets':
      case 'employees':
      case 'locations':
      case 'assignments':
        // All roles can view these pages
        return true;
      default:
        return true;
    }
  }

  navigateToProfile(): void {
    this.userDropdownOpen = false;
    this.router.navigate(['/profile']);
  }

  onLogout(): void {
    this.userDropdownOpen = false;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
