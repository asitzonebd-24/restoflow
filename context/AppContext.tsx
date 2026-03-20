
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES, DEFAULT_MENU_IMAGE, DEFAULT_AVATAR, DEFAULT_BUSINESS_LOGO } from '../constants';
import { supabase, isSupabaseConfigured } from '../supabase';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  business: Business;
  tenants: Business[];
  orders: Order[];
  inventory: InventoryItem[];
  menu: MenuItem[];
  login: (emailOrMobile: string, password: string, tenantId?: string | null) => boolean;
  logout: () => void;
  addOrder: (order: Omit<Order, 'tenantId'>) => Promise<void>;
  updateOrderItems: (orderId: string, items: OrderItem[], totalAmount: number, note?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderItemStatus: (orderId: string, rowId: string, status: ItemStatus) => Promise<void>;
  updateInventory: (itemId: string, quantityChange: number) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'tenantId'>) => Promise<void>;
  editInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'tenantId'>) => Promise<void>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addMenuCategory: (catName: string) => void;
  renameMenuCategory: (oldName: string, newName: string) => void;
  deleteMenuCategory: (catName: string) => void;
  addExpenseCategory: (catName: string) => void;
  renameExpenseCategory: (oldName: string, newName: string) => void;
  deleteExpenseCategory: (catName: string) => void;
  users: User[];
  addUser: (user: User | Omit<User, 'tenantId'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateBusiness: (updates: Partial<Business>) => Promise<void>;
  updateTenant: (tenantId: string, updates: Partial<Business>) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  currentTenant: Business;
  currentTenantId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  createBusiness: (businessData: Partial<Business>, ownerData: Partial<User>) => Promise<void>;
  toggleBusinessStatus: (tenantId: string) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'tenantId'>) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'tenantId'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  monthlyBills: MonthlyBill[];
  generateMonthlyBills: (month: string) => Promise<void>;
  approveBill: (billId: string) => Promise<void>;
  allUsers: User[];
  isLoading: boolean;
  dbStatus: {
    isConfigured: boolean;
    hasTables: boolean;
    missingTables: string[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ENHANCED_MOCK_USERS: User[] = [
  ...MOCK_USERS,
  {
    id: 'u-cust',
    tenantId: '01',
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('resto_flow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Business[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{
    isConfigured: boolean;
    hasTables: boolean;
    missingTables: string[];
  }>({
    isConfigured: isSupabaseConfigured,
    hasTables: false,
    missingTables: []
  });

  const fetchData = async () => {
    setIsLoading(true);
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using mock data.');
      setDbStatus(prev => ({ ...prev, isConfigured: false }));
      setTenants([BUSINESS_DETAILS]);
      setAllUsers(ENHANCED_MOCK_USERS);
      setAllOrders(INITIAL_ORDERS);
      setAllInventory(MOCK_INVENTORY);
      setAllMenu(MOCK_MENU);
      setAllExpenses(MOCK_EXPENSES);
      setIsLoading(false);
      return;
    }

    try {
      const results = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('users').select('*'),
        supabase.from('menu_items').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('monthly_bills').select('*')
      ]);

      const errors = results.map((r, i) => r.error ? { table: ['tenants', 'users', 'menu_items', 'inventory_items', 'orders', 'transactions', 'expenses', 'monthly_bills'][i], error: r.error } : null).filter(Boolean);
      
      if (errors.length > 0) {
        console.error('Supabase tables missing or inaccessible:', errors);
        setDbStatus(prev => ({ 
          ...prev, 
          hasTables: false, 
          missingTables: errors.map(e => e?.table || '') 
        }));
        
        // Fallback to mock data if tables are missing
        setTenants([BUSINESS_DETAILS]);
        setAllUsers(ENHANCED_MOCK_USERS);
        setAllOrders(INITIAL_ORDERS);
        setAllInventory(MOCK_INVENTORY);
        setAllMenu(MOCK_MENU);
        setAllExpenses(MOCK_EXPENSES);
        setIsLoading(false);
        return;
      }

      setDbStatus(prev => ({ ...prev, hasTables: true, missingTables: [] }));

      const [
        { data: tenantsData },
        { data: usersData },
        { data: menuData },
        { data: inventoryData },
        { data: ordersData },
        { data: transactionsData },
        { data: expensesData },
        { data: billsData }
      ] = results;

      if (tenantsData && tenantsData.length > 0) {
        setTenants(tenantsData.map(t => ({
          ...t,
          expenseCategories: t.expense_categories,
          menuCategories: t.menu_categories,
          customerTokenPrefix: t.customer_token_prefix,
          nextCustomerToken: t.next_customer_token,
          customerAppEnabled: t.customer_app_enabled,
          isActive: t.is_active,
          monthlyBill: t.monthly_bill,
          billingDay: t.billing_day,
          createdAt: t.created_at
        })));
      } else {
        setTenants([BUSINESS_DETAILS]);
      }

      if (usersData && usersData.length > 0) {
        setAllUsers(usersData.map(u => ({
          ...u,
          tenantId: u.tenant_id
        })));
      } else {
        setAllUsers(ENHANCED_MOCK_USERS);
      }

      if (menuData) {
        setAllMenu(menuData.map(m => ({
          ...m,
          tenantId: m.tenant_id,
          isAvailable: m.is_available
        })));
      }

      if (inventoryData) {
        setAllInventory(inventoryData.map(i => ({
          ...i,
          tenantId: i.tenant_id,
          minThreshold: i.min_threshold,
          lastUpdated: i.last_updated
        })));
      }

      if (ordersData) {
        setAllOrders(ordersData.map(o => ({
          ...o,
          tenantId: o.tenant_id,
          tokenNumber: o.token_number,
          tableNumber: o.table_number,
          totalAmount: o.total_amount,
          createdBy: o.created_by,
          createdAt: o.created_at
        })));
      }

      if (transactionsData) {
        setAllTransactions(transactionsData.map(t => ({
          ...t,
          tenantId: t.tenant_id,
          orderId: t.order_id,
          paymentMethod: t.payment_method,
          itemsSummary: t.items_summary,
          creatorName: t.creator_name,
          date: t.created_at
        })));
      }

      if (expensesData) {
        setAllExpenses(expensesData.map(e => ({
          ...e,
          tenantId: e.tenant_id,
          recordedBy: e.recorded_by
        })));
      }

      if (billsData) {
        setMonthlyBills(billsData.map(b => ({
          ...b,
          tenantId: b.tenant_id,
          tenantName: b.tenant_name,
          approvedAt: b.approved_at,
          createdAt: b.created_at
        })));
      }

    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
      setTenants([BUSINESS_DETAILS]);
      setAllUsers(ENHANCED_MOCK_USERS);
      setAllOrders(INITIAL_ORDERS);
      setAllInventory(MOCK_INVENTORY);
      setAllMenu(MOCK_MENU);
      setAllExpenses(MOCK_EXPENSES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const business = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    if (!targetId) return tenants[0] || BUSINESS_DETAILS;
    return tenants.find(t => String(t.id) === String(targetId)) || tenants[0] || BUSINESS_DETAILS;
  }, [currentUser, tenants, currentTenantId]);

  const orders = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allOrders.filter(o => String(o.tenantId) === String(targetId));
  }, [allOrders, currentUser, currentTenantId]);

  const inventory = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allInventory.filter(i => String(i.tenantId) === String(targetId));
  }, [allInventory, currentUser, currentTenantId]);

  const menu = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allMenu.filter(m => String(m.tenantId) === String(targetId));
  }, [allMenu, currentUser, currentTenantId]);

  const users = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allUsers.filter(u => String(u.tenantId) === String(targetId) || u.role === Role.SUPER_ADMIN);
  }, [allUsers, currentUser, currentTenantId]);

  const transactions = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allTransactions.filter(t => String(t.tenantId) === String(targetId));
  }, [allTransactions, currentUser, currentTenantId]);

  const expenses = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allExpenses.filter(e => String(e.tenantId) === String(targetId));
  }, [allExpenses, currentUser, currentTenantId]);

  const login = (emailOrMobile: string, password: string, tenantId?: string | null): boolean => {
    const user = allUsers.find(u => 
      (u.email.toLowerCase() === emailOrMobile.toLowerCase() || u.mobile === emailOrMobile) && 
      u.password === password
    );
    
    if (user) {
      // If a specific tenantId is provided in the URL, verify the user belongs to it
      // (Unless they are a SUPER_ADMIN who can access any tenant)
      if (tenantId && user.tenantId && String(user.tenantId) !== String(tenantId) && user.role !== Role.SUPER_ADMIN) {
        return false;
      }
      
      // If they are logging in from the main portal (no tenantId), 
      // they must either be a SUPER_ADMIN OR have a tenantId (business user)
      if (!tenantId && user.role !== Role.SUPER_ADMIN && !user.tenantId) {
        return false;
      }

      setCurrentUser(user);
      localStorage.setItem('resto_flow_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('resto_flow_user');
  };

  const addOrder = async (order: Omit<Order, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || '';
    const newOrder = { ...order, tenantId } as Order;
    
    setAllOrders(prev => [newOrder, ...prev]);

    try {
      const { error } = await supabase.from('orders').insert({
        id: newOrder.id,
        tenant_id: newOrder.tenantId,
        token_number: newOrder.tokenNumber,
        table_number: newOrder.tableNumber,
        items: newOrder.items,
        status: newOrder.status,
        total_amount: newOrder.totalAmount,
        note: newOrder.note,
        created_by: newOrder.createdBy,
        created_at: newOrder.createdAt
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding order to Supabase:', error);
    }
  };

  const updateOrderItems = async (orderId: string, items: OrderItem[], totalAmount: number, note?: string) => {
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, items, totalAmount, note: note ?? o.note } : o));

    try {
      await supabase.from('orders').update({
        items,
        total_amount: totalAmount,
        note: note
      }).eq('id', orderId);
    } catch (error) {
      console.error('Error updating order items in Supabase:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(i => ({ ...i, status: status as unknown as ItemStatus }));
        return { ...o, status, items: updatedItems };
      }
      return o;
    }));

    try {
      const { error } = await supabase.from('orders').update({
        status,
        items: allOrders.find(o => o.id === orderId)?.items.map(i => ({ ...i, status: status as unknown as ItemStatus }))
      }).eq('id', orderId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status in Supabase:', error);
    }
  };

  const updateOrderItemStatus = async (orderId: string, rowId: string, status: ItemStatus) => {
    let updatedOrder: Order | undefined;
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = o.items.map(i => i.rowId === rowId ? { ...i, status } : i);
        let newOrderStatus = o.status;
        const allReady = newItems.every(i => i.status === OrderStatus.READY);
        const anyPreparing = newItems.some(i => i.status === OrderStatus.PREPARING);
        if (allReady) newOrderStatus = OrderStatus.READY;
        else if (anyPreparing) newOrderStatus = OrderStatus.PREPARING;
        else newOrderStatus = OrderStatus.PENDING;
        updatedOrder = { ...o, items: newItems, status: newOrderStatus };
        return updatedOrder;
      }
      return o;
    }));

    if (updatedOrder) {
      try {
        await supabase.from('orders').update({
          items: updatedOrder.items,
          status: updatedOrder.status
        }).eq('id', orderId);
      } catch (error) {
        console.error('Error updating order item status in Supabase:', error);
      }
    }
  };

  const updateInventory = async (itemId: string, quantityChange: number) => {
    setAllInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantityChange } : i));

    try {
      const item = allInventory.find(i => i.id === itemId);
      if (item) {
        await supabase.from('inventory_items').update({
          quantity: item.quantity + quantityChange,
          last_updated: new Date().toISOString()
        }).eq('id', itemId);
      }
    } catch (error) {
      console.error('Error updating inventory in Supabase:', error);
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || '';
    const newItem = { ...item, tenantId } as InventoryItem;
    setAllInventory(prev => [...prev, newItem]);

    try {
      const { error } = await supabase.from('inventory_items').insert({
        id: newItem.id,
        tenant_id: newItem.tenantId,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        min_threshold: newItem.minThreshold,
        last_updated: new Date().toISOString()
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding inventory item to Supabase:', error);
    }
  };

  const editInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    setAllInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.quantity !== undefined) supabaseUpdates.quantity = updates.quantity;
      if (updates.unit) supabaseUpdates.unit = updates.unit;
      if (updates.minThreshold !== undefined) supabaseUpdates.min_threshold = updates.minThreshold;
      supabaseUpdates.last_updated = new Date().toISOString();

      await supabase.from('inventory_items').update(supabaseUpdates).eq('id', id);
    } catch (error) {
      console.error('Error editing inventory item in Supabase:', error);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || '';
    const newItem = { 
      ...item, 
      tenantId,
      image: item.image || DEFAULT_MENU_IMAGE
    } as MenuItem;
    setAllMenu(prev => [...prev, newItem]);

    try {
      const { error } = await supabase.from('menu_items').insert({
        id: newItem.id,
        tenant_id: newItem.tenantId,
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        category: newItem.category,
        image: newItem.image,
        is_available: newItem.isAvailable,
        stock: newItem.stock
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding menu item to Supabase:', error);
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    setAllMenu(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));

    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.price !== undefined) supabaseUpdates.price = updates.price;
      if (updates.category) supabaseUpdates.category = updates.category;
      if (updates.image) supabaseUpdates.image = updates.image;
      if (updates.isAvailable !== undefined) supabaseUpdates.is_available = updates.isAvailable;
      if (updates.stock !== undefined) supabaseUpdates.stock = updates.stock;

      await supabase.from('menu_items').update(supabaseUpdates).eq('id', itemId);
    } catch (error) {
      console.error('Error updating menu item in Supabase:', error);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    setAllMenu(prev => prev.filter(i => i.id !== itemId));

    try {
      await supabase.from('menu_items').delete().eq('id', itemId);
    } catch (error) {
      console.error('Error deleting menu item from Supabase:', error);
    }
  };

  const addMenuCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = [...(tenant.menuCategories || []), catName];
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, menuCategories: newCategories } : t));

    try {
      const { error } = await supabase.from('tenants').update({
        menu_categories: newCategories
      }).eq('id', tenantId);
      if (error) throw error;
    } catch (error) {
      console.error('Error adding menu category to Supabase:', error);
    }
  };

  const renameMenuCategory = async (oldName: string, newName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = (tenant.menuCategories || []).map(c => c === oldName ? newName : c);
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, menuCategories: newCategories } : t));
    setAllMenu(prev => prev.map(item => item.tenantId === tenantId && item.category === oldName ? { ...item, category: newName } : item));

    try {
      await Promise.all([
        supabase.from('tenants').update({ menu_categories: newCategories }).eq('id', tenantId),
        supabase.from('menu_items').update({ category: newName }).eq('tenant_id', tenantId).eq('category', oldName)
      ]);
    } catch (error) {
      console.error('Error renaming menu category in Supabase:', error);
    }
  };

  const deleteMenuCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = (tenant.menuCategories || []).filter(c => c !== catName);
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, menuCategories: newCategories } : t));
    setAllMenu(prev => prev.map(item => item.tenantId === tenantId && item.category === catName ? { ...item, category: 'Uncategorized' } : item));

    try {
      await Promise.all([
        supabase.from('tenants').update({ menu_categories: newCategories }).eq('id', tenantId),
        supabase.from('menu_items').update({ category: 'Uncategorized' }).eq('tenant_id', tenantId).eq('category', catName)
      ]);
    } catch (error) {
      console.error('Error deleting menu category in Supabase:', error);
    }
  };

  const addExpenseCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = [...tenant.expenseCategories, catName];
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, expenseCategories: newCategories } : t));

    try {
      await supabase.from('tenants').update({
        expense_categories: newCategories
      }).eq('id', tenantId);
    } catch (error) {
      console.error('Error adding expense category to Supabase:', error);
    }
  };

  const renameExpenseCategory = async (oldName: string, newName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = tenant.expenseCategories.map(c => c === oldName ? newName : c);
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, expenseCategories: newCategories } : t));
    setAllExpenses(prev => prev.map(e => e.tenantId === tenantId && e.category === oldName ? { ...e, category: newName } : e));

    try {
      await Promise.all([
        supabase.from('tenants').update({ expense_categories: newCategories }).eq('id', tenantId),
        supabase.from('expenses').update({ category: newName }).eq('tenant_id', tenantId).eq('category', oldName)
      ]);
    } catch (error) {
      console.error('Error renaming expense category in Supabase:', error);
    }
  };

  const deleteExpenseCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = tenant.expenseCategories.filter(c => c !== catName);
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, expenseCategories: newCategories } : t));
    setAllExpenses(prev => prev.map(e => e.tenantId === tenantId && e.category === catName ? { ...e, category: 'Other' } : e));

    try {
      await Promise.all([
        supabase.from('tenants').update({ expense_categories: newCategories }).eq('id', tenantId),
        supabase.from('expenses').update({ category: 'Other' }).eq('tenant_id', tenantId).eq('category', catName)
      ]);
    } catch (error) {
      console.error('Error deleting expense category in Supabase:', error);
    }
  };

  const addUser = async (user: User | Omit<User, 'tenantId'>) => {
    const tenantId = (user as User).tenantId || currentUser?.tenantId || '';
    const newUser = { 
      ...user, 
      tenantId,
      avatar: (user as User).avatar || DEFAULT_AVATAR
    } as User;
    setAllUsers(prev => [...prev, newUser]);

    try {
      const { error } = await supabase.from('users').insert({
        id: newUser.id,
        tenant_id: newUser.tenantId,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        mobile: newUser.mobile,
        role: newUser.role,
        avatar: newUser.avatar,
        permissions: newUser.permissions
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding user to Supabase:', error);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.email) supabaseUpdates.email = updates.email;
      if (updates.password) supabaseUpdates.password = updates.password;
      if (updates.mobile) supabaseUpdates.mobile = updates.mobile;
      if (updates.role) supabaseUpdates.role = updates.role;
      if (updates.avatar) supabaseUpdates.avatar = updates.avatar;
      if (updates.permissions) supabaseUpdates.permissions = updates.permissions;

      await supabase.from('users').update(supabaseUpdates).eq('id', userId);
    } catch (error) {
      console.error('Error updating user in Supabase:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (userToDelete?.role === Role.SUPER_ADMIN) {
      console.error('Cannot delete Super Admin account.');
      return;
    }

    if (userId === currentUser?.id) {
      console.error('Cannot delete your own account.');
      return;
    }

    setAllUsers(prev => prev.filter(u => u.id !== userId));

    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (error) {
      console.error('Error deleting user from Supabase:', error);
    }
  };

  const updateBusiness = async (updates: Partial<Business>) => {
    const tenantId = currentUser?.tenantId || '';
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));

    try {
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.logo) supabaseUpdates.logo = updates.logo;
      if (updates.address) supabaseUpdates.address = updates.address;
      if (updates.phone) supabaseUpdates.phone = updates.phone;
      if (updates.currency) supabaseUpdates.currency = updates.currency;
      if (updates.vatRate !== undefined) supabaseUpdates.vat_rate = updates.vatRate;
      if (updates.includeVat !== undefined) supabaseUpdates.include_vat = updates.includeVat;
      if (updates.timezone) supabaseUpdates.timezone = updates.timezone;
      if (updates.themeColor) supabaseUpdates.theme_color = updates.themeColor;
      if (updates.customerTokenPrefix) supabaseUpdates.customer_token_prefix = updates.customerTokenPrefix;
      if (updates.nextCustomerToken !== undefined) supabaseUpdates.next_customer_token = updates.nextCustomerToken;
      if (updates.customerAppEnabled !== undefined) supabaseUpdates.customer_app_enabled = updates.customerAppEnabled;

      await supabase.from('tenants').update(supabaseUpdates).eq('id', tenantId);
    } catch (error) {
      console.error('Error updating business in Supabase:', error);
    }
  };

  const updateTenant = async (tenantId: string, updates: Partial<Business>) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));

    try {
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.address !== undefined) supabaseUpdates.address = updates.address;
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
      if (updates.currency !== undefined) supabaseUpdates.currency = updates.currency;
      if (updates.monthlyBill !== undefined) supabaseUpdates.monthly_bill = updates.monthlyBill;
      if (updates.billingDay !== undefined) supabaseUpdates.billing_day = updates.billingDay;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;

      await supabase.from('tenants').update(supabaseUpdates).eq('id', tenantId);
    } catch (error) {
      console.error('Error updating tenant in Supabase:', error);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    // Prevent deleting the last tenant or something? Maybe not needed.
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setAllUsers(prev => prev.filter(u => u.tenantId !== tenantId));
    setAllMenu(prev => prev.filter(m => m.tenantId !== tenantId));
    setAllOrders(prev => prev.filter(o => o.tenantId !== tenantId));
    setAllInventory(prev => prev.filter(i => i.tenantId !== tenantId));
    setAllTransactions(prev => prev.filter(t => t.tenantId !== tenantId));
    setAllExpenses(prev => prev.filter(e => e.tenantId !== tenantId));

    try {
      // Delete all related data in Supabase
      await Promise.all([
        supabase.from('tenants').delete().eq('id', tenantId),
        supabase.from('users').delete().eq('tenant_id', tenantId),
        supabase.from('menu_items').delete().eq('tenant_id', tenantId),
        supabase.from('orders').delete().eq('tenant_id', tenantId),
        supabase.from('inventory_items').delete().eq('tenant_id', tenantId),
        supabase.from('transactions').delete().eq('tenant_id', tenantId),
        supabase.from('expenses').delete().eq('tenant_id', tenantId)
      ]);
    } catch (error) {
      console.error('Error deleting tenant from Supabase:', error);
    }
  };

  const toggleBusinessStatus = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isActive: !t.isActive } : t));

    try {
      await supabase.from('tenants').update({ is_active: !tenant.isActive }).eq('id', tenantId);
    } catch (error) {
      console.error('Error toggling business status in Supabase:', error);
    }
  };

  const createBusiness = async (businessData: Partial<Business>, ownerData: Partial<User>) => {
    // Generate numeric ID starting at 01
    const numericIds = tenants
      .map(t => parseInt(t.id))
      .filter(id => !isNaN(id))
      .sort((a, b) => b - a);
    
    const nextId = numericIds.length > 0 ? numericIds[0] + 1 : 1;
    const newTenantId = nextId < 10 ? `0${nextId}` : `${nextId}`;

    const newBusiness: Business = {
      id: newTenantId,
      name: businessData.name || 'New Restaurant',
      logo: businessData.logo || DEFAULT_BUSINESS_LOGO,
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

    try {
      const [tenantResult, userResult] = await Promise.all([
        supabase.from('tenants').insert({
          id: newBusiness.id,
          name: newBusiness.name,
          logo: newBusiness.logo,
          address: newBusiness.address,
          phone: newBusiness.phone,
          currency: newBusiness.currency,
          vat_rate: newBusiness.vatRate,
          include_vat: newBusiness.includeVat,
          timezone: newBusiness.timezone,
          theme_color: newBusiness.themeColor,
          expense_categories: newBusiness.expenseCategories,
          menu_categories: newBusiness.menuCategories,
          customer_token_prefix: newBusiness.customerTokenPrefix,
          next_customer_token: newBusiness.nextCustomerToken,
          customer_app_enabled: newBusiness.customerAppEnabled,
          is_active: newBusiness.isActive,
          monthly_bill: newBusiness.monthlyBill,
          billing_day: newBusiness.billingDay,
          created_at: newBusiness.createdAt
        }),
        supabase.from('users').insert({
          id: newOwner.id,
          tenant_id: newOwner.tenantId,
          name: newOwner.name,
          email: newOwner.email,
          password: newOwner.password,
          mobile: newOwner.mobile,
          role: newOwner.role,
          avatar: newOwner.avatar,
          permissions: newOwner.permissions
        })
      ]);

      if (tenantResult.error) throw tenantResult.error;
      if (userResult.error) throw userResult.error;
    } catch (error) {
      console.error('Error creating business in Supabase:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || '';
    const newTransaction = { ...transaction, tenantId } as Transaction;
    setAllTransactions(prev => [newTransaction, ...prev]);

    try {
      const { error } = await supabase.from('transactions').insert({
        id: newTransaction.id,
        tenant_id: newTransaction.tenantId,
        order_id: newTransaction.orderId,
        amount: newTransaction.amount,
        payment_method: newTransaction.paymentMethod,
        items_summary: newTransaction.itemsSummary,
        creator_name: newTransaction.creatorName,
        created_at: newTransaction.date
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding transaction to Supabase:', error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || '';
    const newExpense = { ...expense, tenantId } as Expense;
    setAllExpenses(prev => [newExpense, ...prev]);

    try {
      const { error } = await supabase.from('expenses').insert({
        id: newExpense.id,
        tenant_id: newExpense.tenantId,
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
        date: newExpense.date,
        note: newExpense.note,
        recorded_by: newExpense.recordedBy
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding expense to Supabase:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    setAllExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting expense from Supabase:', error);
    }
  };

  const generateMonthlyBills = async (month: string) => {
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

    const filteredNewBills = newBills.filter(nb => 
      !monthlyBills.some(mb => mb.tenantId === nb.tenantId && mb.month === nb.month)
    );

    setMonthlyBills(prev => [...prev, ...filteredNewBills]);

    try {
      if (filteredNewBills.length > 0) {
        const { error } = await supabase.from('monthly_bills').insert(filteredNewBills.map(b => ({
          id: b.id,
          tenant_id: b.tenantId,
          tenant_name: b.tenantName,
          month: b.month,
          amount: b.amount,
          status: b.status,
          created_at: b.createdAt
        })));
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error generating monthly bills in Supabase:', error);
    }
  };

  const approveBill = async (billId: string) => {
    const approvedAt = new Date().toISOString();
    setMonthlyBills(prev => prev.map(bill => 
      bill.id === billId 
        ? { ...bill, status: BillStatus.APPROVED, approvedAt } 
        : bill
    ));

    try {
      await supabase.from('monthly_bills').update({
        status: BillStatus.APPROVED,
        approved_at: approvedAt
      }).eq('id', billId);
    } catch (error) {
      console.error('Error approving bill in Supabase:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
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
      deleteTenant,
      currentTenant: business,
      currentTenantId,
      setCurrentTenantId,
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
      allUsers,
      isLoading,
      dbStatus
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
