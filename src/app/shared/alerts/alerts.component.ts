import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService } from '../../core/services/alert.service';
import { Alert, AlertType } from '../../core/models/alert.models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  private subscription: Subscription = new Subscription();

  AlertType = AlertType;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.alertService.getAlerts().subscribe(alerts => {
        this.alerts = alerts;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  trackByFn(index: number, alert: Alert): string {
    return alert.id;
  }

  removeAlert(id: string): void {
    this.alertService.removeAlert(id);
  }

  getAlertClasses(type: AlertType): string {
    const baseClasses = 'p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm transition-all duration-300 hover:shadow-xl';
    
    switch (type) {
      case AlertType.Success:
        return `${baseClasses} bg-green-50/95 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-300`;
      case AlertType.Error:
        return `${baseClasses} bg-red-50/95 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-300`;
      case AlertType.Warning:
        return `${baseClasses} bg-yellow-50/95 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-300`;
      case AlertType.Info:
        return `${baseClasses} bg-blue-50/95 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-300`;
      default:
        return `${baseClasses} bg-slate-50/95 dark:bg-slate-900/20 border-slate-400 text-slate-800 dark:text-slate-300`;
    }
  }

  getIconName(type: AlertType): string {
    switch (type) {
      case AlertType.Success:
        return 'check_circle';
      case AlertType.Error:
        return 'error';
      case AlertType.Warning:
        return 'warning';
      case AlertType.Info:
        return 'info';
      default:
        return 'info';
    }
  }

  getIconColor(type: AlertType): string {
    switch (type) {
      case AlertType.Success:
        return 'text-green-500 dark:text-green-400';
      case AlertType.Error:
        return 'text-red-500 dark:text-red-400';
      case AlertType.Warning:
        return 'text-yellow-500 dark:text-yellow-400';
      case AlertType.Info:
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  }
}