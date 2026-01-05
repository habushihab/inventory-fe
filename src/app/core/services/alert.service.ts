import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Alert, AlertType } from '../models/alert.models';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alerts = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alerts.asObservable();

  constructor() {}

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      dismissible: alert.dismissible ?? true,
      duration: alert.duration ?? 5000
    };

    const currentAlerts = this.alerts.value;
    this.alerts.next([...currentAlerts, newAlert]);

    // Auto dismiss if duration is set and > 0
    if (newAlert.duration && newAlert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(newAlert.id);
      }, newAlert.duration);
    }
  }

  success(title: string, message?: string, options?: Partial<Alert>): void {
    this.addAlert({
      type: AlertType.Success,
      title,
      message,
      ...options
    });
  }

  error(title: string, message?: string, options?: Partial<Alert>): void {
    this.addAlert({
      type: AlertType.Error,
      title,
      message,
      duration: options?.duration ?? 0, // Errors don't auto-dismiss by default
      ...options
    });
  }

  warning(title: string, message?: string, options?: Partial<Alert>): void {
    this.addAlert({
      type: AlertType.Warning,
      title,
      message,
      duration: options?.duration ?? 7000, // Warnings show longer
      ...options
    });
  }

  info(title: string, message?: string, options?: Partial<Alert>): void {
    this.addAlert({
      type: AlertType.Info,
      title,
      message,
      ...options
    });
  }

  removeAlert(id: string): void {
    const currentAlerts = this.alerts.value;
    this.alerts.next(currentAlerts.filter(alert => alert.id !== id));
  }

  clearAll(): void {
    this.alerts.next([]);
  }

  getAlerts(): Observable<Alert[]> {
    return this.alerts$;
  }
}