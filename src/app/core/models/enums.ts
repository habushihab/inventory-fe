export enum AssetStatus {
  Available = 1,
  Assigned = 2,
  UnderMaintenance = 3,
  Retired = 4,
  Lost = 5
}

export enum AssetCategory {
  Laptop = 1,
  Monitor = 2,
  MobilePhone = 3,
  Keyboard = 4,
  Mouse = 5,
  Headset = 6,
  Webcam = 7,
  Printer = 8,
  Router = 9,
  Switch = 10,
  AccessPoint = 11,
  Tablet = 12,
  Other = 99
}

export enum UserRole {
  Viewer = 1,
  ITOfficer = 2,
  Admin = 3
}

export enum AuditAction {
  Created = 1,
  Updated = 2,
  Assigned = 3,
  Unassigned = 4,
  StatusChanged = 5,
  LocationChanged = 6,
  Deleted = 7
}

