
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  CUSTOMER = 'CUSTOMER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type ItemStatus = OrderStatus.PENDING | OrderStatus.PREPARING | OrderStatus.READY | OrderStatus.COMPLETED | OrderStatus.CANCELLED;

export interface Business {
  id: string;
  name: string;
  logo: string;
  address: string;
  phone: string;
  currency: string;
  vatRate: number;
  includeVat: boolean;
  timezone: string;
  themeColor: string;
  expenseCategories: string[];
  menuCategories: string[];
  customerTokenPrefix: string;
  nextCustomerToken: number;
  customerAppEnabled: boolean;
  isActive: boolean;
  monthlyBill: number;
  billingDay: number;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId?: string; // Optional for Super Admin
  name: string;
  email: string;
  password?: string;
  mobile: string;
  role: Role;
  permissions: string[];
  avatar: string;
  address?: string;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  stock?: number; // Optional stock/quantity field
}

export interface OrderItem {
  rowId: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  status: ItemStatus;
}

export interface Order {
  id: string;
  tenantId: string;
  tokenNumber: string;
  tableNumber?: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  totalAmount: number;
  note?: string;
  deliveryAddress?: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  date: string;
  paymentMethod: string;
  itemsSummary: string;
  creatorName: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  recordedBy: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  supplier: string;
  pricePerUnit: number;
}

export enum BillStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export interface MonthlyBill {
  id: string;
  tenantId: string;
  tenantName: string;
  month: string; // e.g., "March 2026"
  amount: number;
  status: BillStatus;
  createdAt: string;
  approvedAt?: string;
}
