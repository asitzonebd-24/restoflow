
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
    id: 'sa-user', name: 'Super Admin', email: 'asitzonebd@gmail.com', password: 'admin', mobile: '0000000', role: Role.SUPER_ADMIN, avatar: '',
    permissions: ['Portal']
  },
  {
    id: 'demo-sa', name: 'Demo Admin', email: 'admin@portal.com', password: 'admin', mobile: '1111111', role: Role.SUPER_ADMIN, avatar: '',
    permissions: ['Portal']
  }
];

export const MOCK_MENU: MenuItem[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const MOCK_EXPENSES: Expense[] = [];
