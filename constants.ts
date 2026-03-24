
import { Role, Business, User, MenuItem, InventoryItem, Order, OrderStatus, Expense } from './types';

export const DEFAULT_MENU_IMAGE = '';
export const DEFAULT_AVATAR = '';
export const DEFAULT_BUSINESS_LOGO = '';

export const BUSINESS_DETAILS: Business = {
  id: '01',
  name: 'Resto Keep Bistro',
  logo: DEFAULT_BUSINESS_LOGO,
  address: '77 Culinary Ave, Food District, NY 10001',
  phone: '+1 555-0123',
  currency: '৳',
  vatRate: 10,
  includeVat: true,
  timezone: 'EST',
  themeColor: '#000000',
  expenseCategories: ['Inventory', 'Maintenance', 'Utilities', 'Salaries', 'Marketing', 'Other'],
  menuCategories: ['Main', 'Starter', 'Beverage', 'Dessert'],
  customerTokenPrefix: 'WEB',
  nextCustomerToken: 100,
  customerAppEnabled: true,
  isActive: true,
  monthlyBill: 500,
  billingDay: 1,
  createdAt: new Date().toISOString()
};

const ALL_PERMISSIONS = ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings'];

export const MOCK_USERS: User[] = [
  {
    id: 'sa-user', name: 'Super Admin', email: 'asitzonebd@gmail.com', password: '', mobile: '0000000', role: Role.SUPER_ADMIN, avatar: '',
    permissions: ['Portal']
  }
];

export const MOCK_MENU: MenuItem[] = [
  { id: 'm1', tenantId: '01', name: 'Signature Ramen', price: 18.00, category: 'Main', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=200&h=200&auto=format&fit=crop', isAvailable: true },
  { id: 'm2', tenantId: '01', name: 'Gyoza Dumplings', price: 9.00, category: 'Starter', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=200&h=200&auto=format&fit=crop', isAvailable: true },
  { id: 'm3', tenantId: '01', name: 'Matcha Iced Tea', price: 5.50, category: 'Beverage', image: 'https://images.unsplash.com/photo-1582722872445-41ca501ea146?q=80&w=200&h=200&auto=format&fit=crop', isAvailable: true },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', tenantId: '01', name: 'Flour', unit: 'kg', quantity: 50, minThreshold: 10, supplier: 'Grain Co', pricePerUnit: 2 },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'o1',
    tenantId: '01',
    tokenNumber: '12',
    items: [
      { rowId: 'row-1', itemId: 'm1', name: 'Signature Ramen', quantity: 2, price: 18.00, status: OrderStatus.PREPARING }
    ],
    status: OrderStatus.PREPARING,
    createdAt: new Date().toISOString(),
    createdBy: 'u2',
    totalAmount: 36.00
  }
];

export const MOCK_EXPENSES: Expense[] = [];
