import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const user = authService.getUser();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Debug logging (remove in production)
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      console.log('🔐 Auth Interceptor:', {
        method: req.method,
        url: req.url,
        hasToken: !!token,
        tokenLength: token?.length,
        userRole: user?.role,
        userEmail: user?.email
      });
    }
  } else {
    console.warn('⚠️ No token found for request:', req.method, req.url);
  }

  return next(req);
};

