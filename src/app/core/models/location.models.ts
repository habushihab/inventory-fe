export interface LocationDto {
  id: number;
  building: string;
  floor: number;
  room?: string;
  description?: string;
  fullLocation: string;
  isActive: boolean;
}

export interface CreateLocationRequest {
  building: string;
  floor: number;
  room?: string;
  description?: string;
}

