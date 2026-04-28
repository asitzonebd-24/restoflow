
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  DELIVERY = 'DELIVERY',
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

export interface PrinterSettings {
  receiptHeader?: string;
  receiptFooter?: string;
  paperWidth: '58mm' | '80mm';
  autoPrintKOT: boolean;
  autoPrintInvoice: boolean;
  showLogo: boolean;
  pairedPrinterName?: string;
  pairedPrinterId?: string;
  enablePrintAgent?: boolean;
  autoMarkReadyOnPrint?: boolean;
  enablePrinterRelay?: boolean;
}

export enum InventoryMode {
  SIMPLE = 'SIMPLE',
  RECIPE = 'RECIPE',
}

export interface Business {
  id: string;
  slug?: string;
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
  materialNames?: string[];
  suppliers?: string[];
  supplierDues?: Record<string, number>;
  customerTokenPrefix: string;
  nextCustomerToken: number;
  lastTokenDate?: string;
  customerAppEnabled: boolean;
  isActive: boolean;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceTime?: string;
  inventoryMode: InventoryMode;
  monthlyBill: number;
  createdAt: string;
  printerSettings?: PrinterSettings;
  subscription?: {
    packageId: string;
    packageName: string;
    startDate: string;
    expiryDate: string;
    allowedPages: string[];
    status: 'active' | 'expired' | 'trial';
  };
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  allowedPages: string[];
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId?: string; // Legacy/Primary tenant ID
  tenantIds?: string[]; // Multiple tenant IDs for owners
  name: string;
  email: string;
  password?: string;
  mobile: string;
  role: Role;
  permissions: string[];
  avatar: string;
  address?: string;
  assignedCategories?: string[]; // Categories assigned to kitchen staff
  printerSettings?: PrinterSettings;
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
  creatorName?: string;
  totalAmount: number;
  note?: string | null;
  deliveryAddress?: string | null;
  deliveryStaffId?: string | null;
  deliveryStaffName?: string | null;
  deliveryStaffMobile?: string | null;
  discount?: number;
  isPaid?: boolean;
}

export interface Transaction {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  discount?: number;
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
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  menuItemIds?: string[]; // Link to multiple menu items for auto-sync
  menuItemLinks?: { itemId: string; consumption: number }[];
  menuCategory?: string;
  history?: { date: string, action: string, change: number, newStock: number, supplier?: string, totalAmount?: number, paidAmount?: number, dueAmount?: number }[];
}

export interface Recipe {
  id: string;
  tenantId: string;
  menuItemId: string;
  ingredients: {
    inventoryItemId: string;
    quantity: number; // Amount of inventory item needed
  }[];
}

export interface Table {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
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
