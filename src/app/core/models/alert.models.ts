export enum AlertType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = no auto dismiss
  dismissible?: boolean;
  timestamp: Date;
}