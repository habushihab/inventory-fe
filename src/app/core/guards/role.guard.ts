import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as UserRole[];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Handle both string and number role values
  const userRole = user.role;
  const userRoleNumber = typeof userRole === 'string' 
    ? UserRole[userRole as keyof typeof UserRole] 
    : userRole;

  const hasAccess = requiredRoles.some(role => {
    const requiredRoleNumber = typeof role === 'string'
      ? UserRole[role as keyof typeof UserRole]
      : role;
    return userRoleNumber === requiredRoleNumber;
  });

  if (!hasAccess) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
