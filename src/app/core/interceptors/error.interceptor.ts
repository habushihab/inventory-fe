import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authService.logout().subscribe({
          next: () => {
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          },
          error: () => {
            // Even if logout fails, clear storage and redirect
            localStorage.clear();
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
        });
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        const user = authService.getUser();
        console.error('🚫 403 Forbidden:', {
          url: error.url,
          method: req.method,
          user: user,
          userRole: user?.role,
          errorResponse: error.error
        });
        // Don't redirect, just show error message
        // The component will handle displaying the error
      }

      return throwError(() => error);
    })
  );
};

