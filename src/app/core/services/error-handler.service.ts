import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      apiError = {
        message: 'A network error occurred. Please check your connection and try again.',
        status: 0,
        details: error.error
      };
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request. Please check your input and try again.';
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 409:
          errorMessage = error.error?.message || 'A conflict occurred. The resource may already exist.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation failed. Please check your input.';
          break;
        case 500:
          errorMessage = 'A server error occurred. Please try again later.';
          break;
        case 503:
          errorMessage = 'The service is temporarily unavailable. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `An unexpected error occurred (${error.status}).`;
      }

      apiError = {
        message: errorMessage,
        status: error.status,
        details: error.error
      };
    }

    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => apiError);
  }

  getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred.';
  }

  showError(message: string, title: string = 'Error'): void {
    // Simple alert for now - could be replaced with a toast service
    alert(`${title}: ${message}`);
  }

  showSuccess(message: string, title: string = 'Success'): void {
    // Simple alert for now - could be replaced with a toast service
    alert(`${title}: ${message}`);
  }
}