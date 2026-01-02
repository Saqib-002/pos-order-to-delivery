export interface InventoryProduct {
  id: string;
  name: string;
  expenseTypeId?: string;
  expenseType?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
