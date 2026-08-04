export interface DeliveryPerson {
  id: string;
  name: string;
  email?: string;
  username?: string;
  phone: string;
  password?: string;
  vehicleType: "bike" | "motorcycle" | "car" | "scooter" | "van";
  licenseNo?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted?: boolean;
  totalAssigned?: number;
  totalDelivered?: number;
  totalCancelled?: number;
  avgDeliveryTime?: number;
}

export interface DeliveryAssignment {
  orderId: string;
  deliveryPersonId: string;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  notes?: string;
}
