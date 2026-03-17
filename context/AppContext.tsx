
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES } from '../constants';

interface AppContextType {
  currentUser: User | null;
  business: Business;
  tenants: Business[];
  orders: Order[];
  inventory: InventoryItem[];
  menu: MenuItem[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addOrder: (order: Omit<Order, 'tenantId'>) => void;
  updateOrderItems: (orderId: string, items: OrderItem[], totalAmount: number, note?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, rowId: string, status: ItemStatus) => void;
  updateInventory: (itemId: string, quantityChange: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'tenantId'>) => void;
  editInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addMenuItem: (item: Omit<MenuItem, 'tenantId'>) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  addMenuCategory: (catName: string) => void;
  renameMenuCategory: (oldName: string, newName: string) => void;
  deleteMenuCategory: (catName: string) => void;
  addExpenseCategory: (catName: string) => void;
  renameExpenseCategory: (oldName: string, newName: string) => void;
  deleteExpenseCategory: (catName: string) => void;
  users: User[];
  addUser: (user: Omit<User, 'tenantId'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateBusiness: (updates: Partial<Business>) => void;
  updateTenant: (tenantId: string, updates: Partial<Business>) => void;
  currentTenant: Business;
  createBusiness: (businessData: Partial<Business>, ownerData: Partial<User>) => void;
  toggleBusinessStatus: (tenantId: string) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'tenantId'>) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'tenantId'>) => void;
  deleteExpense: (id: string) => void;
  monthlyBills: MonthlyBill[];
  generateMonthlyBills: (month: string) => void;
  approveBill: (billId: string) => void;
  allUsers: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ENHANCED_MOCK_USERS: User[] = [
  ...MOCK_USERS,
  {
    id: 'u-cust',
    tenantId: 't1',
    name: 'Guest Customer',
    email: 'guest@customer.com',
    password: 'password',
    mobile: '0000000',
    role: Role.CUSTOMER,
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=indigo&color=fff',
    permissions: []
  }
];

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Business[]>([BUSINESS_DETAILS]);
  const [allOrders, setAllOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [allMenu, setAllMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [allUsers, setAllUsers] = useState<User[]>(ENHANCED_MOCK_USERS);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);

  const business = useMemo(() => {
    if (!currentUser || !currentUser.tenantId) return tenants[0];
    return tenants.find(t => t.id === currentUser.tenantId) || tenants[0];
  }, [currentUser, tenants]);

  const orders = useMemo(() => 
    allOrders.filter(o => o.tenantId === currentUser?.tenantId), 
    [allOrders, currentUser]
  );

  const inventory = useMemo(() => 
    allInventory.filter(i => i.tenantId === currentUser?.tenantId), 
    [allInventory, currentUser]
  );

  const menu = useMemo(() => 
    allMenu.filter(m => m.tenantId === currentUser?.tenantId), 
    [allMenu, currentUser]
  );

  const users = useMemo(() => 
    allUsers.filter(u => u.tenantId === currentUser?.tenantId || u.role === Role.SUPER_ADMIN), 
    [allUsers, currentUser]
  );

  const transactions = useMemo(() => 
    allTransactions.filter(t => t.tenantId === currentUser?.tenantId), 
    [allTransactions, currentUser]
  );

  const expenses = useMemo(() => 
    allExpenses.filter(e => e.tenantId === currentUser?.tenantId), 
    [allExpenses, currentUser]
  );

  const login = (email: string, password: string): boolean => {
    const user = allUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addOrder = (order: Omit<Order, 'tenantId'>) => setAllOrders(prev => [{ ...order, tenantId: currentUser?.tenantId || '' } as Order, ...prev]);

  const updateOrderItems = (orderId: string, items: OrderItem[], totalAmount: number, note?: string) => {
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, items, totalAmount, note: note ?? o.note } : o));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(i => ({ ...i, status: status as unknown as ItemStatus }));
        return { ...o, status, items: updatedItems };
      }
      return o;
    }));
  };

  const updateOrderItemStatus = (orderId: string, rowId: string, status: ItemStatus) => {
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map(i => i.rowId === rowId ? { ...i, status } : i);
        let newOrderStatus = o.status;
        const allReady = newItems.every(i => i.status === OrderStatus.READY);
        const anyPreparing = newItems.some(i => i.status === OrderStatus.PREPARING);
        if (allReady) newOrderStatus = OrderStatus.READY;
        else if (anyPreparing) newOrderStatus = OrderStatus.PREPARING;
        else newOrderStatus = OrderStatus.PENDING;
        return { ...o, items: newItems, status: newOrderStatus };
      }
      return o;
    }));
  };

  const updateInventory = (itemId: string, quantityChange: number) => {
    setAllInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantityChange } : i));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'tenantId'>) => setAllInventory(prev => [...prev, { ...item, tenantId: currentUser?.tenantId || '' } as InventoryItem]);

  const editInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setAllInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addMenuItem = (item: Omit<MenuItem, 'tenantId'>) => setAllMenu(prev => [...prev, { ...item, tenantId: currentUser?.tenantId || '' } as MenuItem]);

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    setAllMenu(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  };

  const deleteMenuItem = (itemId: string) => setAllMenu(prev => prev.filter(i => i.id !== itemId));

  const addMenuCategory = (catName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, menuCategories: [...(t.menuCategories || []), catName] } : t));
  };

  const renameMenuCategory = (oldName: string, newName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, menuCategories: (t.menuCategories || []).map(c => c === oldName ? newName : c) } : t));
    setAllMenu(prev => prev.map(item => item.tenantId === currentUser?.tenantId && item.category === oldName ? { ...item, category: newName } : item));
  };

  const deleteMenuCategory = (catName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, menuCategories: (t.menuCategories || []).filter(c => c !== catName) } : t));
    setAllMenu(prev => prev.map(item => item.tenantId === currentUser?.tenantId && item.category === catName ? { ...item, category: 'Uncategorized' } : item));
  };

  const addExpenseCategory = (catName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, expenseCategories: [...t.expenseCategories, catName] } : t));
  };

  const renameExpenseCategory = (oldName: string, newName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, expenseCategories: t.expenseCategories.map(c => c === oldName ? newName : c) } : t));
    setAllExpenses(prev => prev.map(e => e.tenantId === currentUser?.tenantId && e.category === oldName ? { ...e, category: newName } : e));
  };

  const deleteExpenseCategory = (catName: string) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, expenseCategories: t.expenseCategories.filter(c => c !== catName) } : t));
    setAllExpenses(prev => prev.map(e => e.tenantId === currentUser?.tenantId && e.category === catName ? { ...e, category: 'Other' } : e));
  };

  const addUser = (user: Omit<User, 'tenantId'>) => setAllUsers(prev => [...prev, { ...user, tenantId: currentUser?.tenantId || '' } as User]);

  const updateUser = (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const deleteUser = (userId: string) => setAllUsers(prev => prev.filter(u => u.id !== userId));

  const updateBusiness = (updates: Partial<Business>) => {
    setTenants(prev => prev.map(t => t.id === currentUser?.tenantId ? { ...t, ...updates } : t));
  };

  const updateTenant = (tenantId: string, updates: Partial<Business>) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
  };

  const toggleBusinessStatus = (tenantId: string) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isActive: !t.isActive } : t));
  };

  const createBusiness = (businessData: Partial<Business>, ownerData: Partial<User>) => {
    const newTenantId = `t-${Date.now()}`;
    const newBusiness: Business = {
      id: newTenantId,
      name: businessData.name || 'New Restaurant',
      logo: businessData.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200&h=200&auto=format&fit=crop',
      address: businessData.address || '',
      phone: businessData.phone || '',
      currency: businessData.currency || '$',
      vatRate: businessData.vatRate || 0,
      includeVat: businessData.includeVat || false,
      timezone: businessData.timezone || 'UTC',
      themeColor: businessData.themeColor || '#0f172a',
      expenseCategories: ['Inventory', 'Utilities', 'Salaries', 'Other'],
      menuCategories: ['Main', 'Starter', 'Beverage', 'Dessert'],
      customerTokenPrefix: 'ORD',
      nextCustomerToken: 1,
      customerAppEnabled: true,
      isActive: true,
      monthlyBill: businessData.monthlyBill || 500,
      billingDay: businessData.billingDay || 1,
      createdAt: new Date().toISOString()
    };

    const newOwner: User = {
      id: `u-${Date.now()}`,
      tenantId: newTenantId,
      name: ownerData.name || 'Owner',
      email: ownerData.email || '',
      password: ownerData.password || 'password',
      mobile: ownerData.mobile || '',
      role: Role.OWNER,
      avatar: `https://i.pravatar.cc/150?u=${newTenantId}`,
      permissions: ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings']
    };

    setTenants(prev => [...prev, newBusiness]);
    setAllUsers(prev => [...prev, newOwner]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'tenantId'>) => setAllTransactions(prev => [{ ...transaction, tenantId: currentUser?.tenantId || '' } as Transaction, ...prev]);

  const addExpense = (expense: Omit<Expense, 'tenantId'>) => setAllExpenses(prev => [{ ...expense, tenantId: currentUser?.tenantId || '' } as Expense, ...prev]);

  const deleteExpense = (id: string) => setAllExpenses(prev => prev.filter(e => e.id !== id));

  const generateMonthlyBills = (month: string) => {
    const activeTenants = tenants.filter(t => t.isActive);
    const newBills: MonthlyBill[] = activeTenants.map(tenant => ({
      id: `bill-${tenant.id}-${month.replace(' ', '-')}-${Date.now()}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      month,
      amount: tenant.monthlyBill,
      status: BillStatus.PENDING,
      createdAt: new Date().toISOString()
    }));

    // Filter out already generated bills for this month to avoid duplicates
    const filteredNewBills = newBills.filter(nb => 
      !monthlyBills.some(mb => mb.tenantId === nb.tenantId && mb.month === nb.month)
    );

    setMonthlyBills(prev => [...prev, ...filteredNewBills]);
  };

  const approveBill = (billId: string) => {
    setMonthlyBills(prev => prev.map(bill => 
      bill.id === billId 
        ? { ...bill, status: BillStatus.APPROVED, approvedAt: new Date().toISOString() } 
        : bill
    ));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      business,
      tenants,
      orders,
      inventory,
      menu,
      login,
      logout,
      addOrder,
      updateOrderItems,
      updateOrderStatus,
      updateOrderItemStatus,
      updateInventory,
      addInventoryItem,
      editInventoryItem,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addMenuCategory,
      renameMenuCategory,
      deleteMenuCategory,
      addExpenseCategory,
      renameExpenseCategory,
      deleteExpenseCategory,
      users,
      addUser,
      updateUser,
      deleteUser,
      updateBusiness,
      updateTenant,
      currentTenant: business,
      createBusiness,
      toggleBusinessStatus,
      transactions,
      addTransaction,
      expenses,
      addExpense,
      deleteExpense,
      monthlyBills,
      generateMonthlyBills,
      approveBill,
      allUsers
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
