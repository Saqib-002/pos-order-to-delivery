export interface DeliveryPerson {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vehicleType: 'bike' | 'motorcycle' | 'car' | 'scooter';
  licenseNo?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
}

export interface DeliveryAssignment {
  orderId: string;
  deliveryPersonId: string;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  notes?: string;
}