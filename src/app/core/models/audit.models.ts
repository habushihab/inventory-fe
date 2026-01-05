import { AuditAction } from './enums';

export interface AuditLog {
  id: number;
  action: AuditAction;
  entityType: string;
  entityId: number;
  assetId?: number;
  employeeId?: number;
  userId: string;
  userName?: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
  timestamp: string;
}

