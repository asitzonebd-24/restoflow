
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus, Recipe } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES, DEFAULT_MENU_IMAGE, DEFAULT_AVATAR, DEFAULT_BUSINESS_LOGO } from '../constants';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
};

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
  updateOrderItems: (
    orderId: string, 
    items: OrderItem[], 
    totalAmount: number, 
    note?: string, 
    status?: OrderStatus,
    deliveryStaffId?: string | null,
    deliveryStaffName?: string | null,
    deliveryStaffMobile?: string | null,
    deliveryAddress?: string | null
  ) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, discount?: number) => Promise<void>;
  updateOrderItemStatus: (orderId: string, rowId: string, status: ItemStatus) => Promise<void>;
  updateInventory: (itemId: string, quantityChange: number) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'tenantId'>) => Promise<void>;
  editInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
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
  createBusiness: (businessData: Partial<Business>, ownerData: Partial<User>, sourceTenantId?: string) => Promise<void>;
  toggleBusinessStatus: (tenantId: string) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'tenantId'>) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'tenantId'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'tenantId'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  monthlyBills: MonthlyBill[];
  generateMonthlyBills: (month: string) => Promise<number>;
  approveBill: (billId: string) => Promise<void>;
  allUsers: User[];
  isLoading: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  categories: string[];
  dbStatus: {
    isConfigured: boolean;
    hasTables: boolean;
    missingTables: string[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ENHANCED_MOCK_USERS: User[] = [
  ...MOCK_USERS
];

const cleanObject = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('resto_keep_user');
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
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [dbStatus, setDbStatus] = useState<{
    isConfigured: boolean;
    hasTables: boolean;
    missingTables: string[];
  }>({
    isConfigured: true,
    hasTables: true,
    missingTables: []
  });

  useEffect(() => {
    // Real-time listeners for all collections
    const unsubscribers: (() => void)[] = [];
    const loadedCollections = new Set<string>();

    const collectionsList = [
      { name: 'tenants', setter: setTenants },
      { name: 'users', setter: setAllUsers },
      { name: 'menu_items', setter: setAllMenu },
      { name: 'inventory_items', setter: setAllInventory },
      { name: 'orders', setter: setAllOrders },
      { name: 'transactions', setter: setAllTransactions },
      { name: 'expenses', setter: setAllExpenses },
      { name: 'recipes', setter: setAllRecipes },
      { name: 'monthly_bills', setter: setMonthlyBills }
    ];

    collectionsList.forEach(({ name, setter }) => {
      const unsub = onSnapshot(collection(db, name), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (name === 'users') {
          // Always ensure super admins from mock data are available
          const firestoreUsers = data as User[];
          const mockSuperAdmins = ENHANCED_MOCK_USERS.filter(u => u.role === Role.SUPER_ADMIN);
          
          const mergedUsers = [...firestoreUsers];
          mockSuperAdmins.forEach(mockSA => {
            const existingIndex = mergedUsers.findIndex(u => u.email.toLowerCase() === mockSA.email.toLowerCase());
            if (existingIndex === -1) {
              mergedUsers.push(mockSA);
            } else {
              // If it's a super admin, ensure it has the mock credentials as a fallback
              // but keep other Firestore data like avatar, etc.
              mergedUsers[existingIndex] = { 
                ...mergedUsers[existingIndex], 
                role: Role.SUPER_ADMIN,
                password: mergedUsers[existingIndex].password || mockSA.password
              };
            }
          });
          
          setter(mergedUsers as any);
        } else if (data.length > 0) {
          setter(data as any);
        } else {
          // Fallback to mock data if collection is empty
          if (name === 'tenants') setter([BUSINESS_DETAILS]);
          if (name === 'menu_items') setter(MOCK_MENU);
          if (name === 'inventory_items') setter(MOCK_INVENTORY);
          if (name === 'orders') setter(INITIAL_ORDERS);
          if (name === 'expenses') setter(MOCK_EXPENSES);
          if (name === 'recipes') setter([]);
          if (name === 'monthly_bills') setter([]);
        }
        
        loadedCollections.add(name);
        if (loadedCollections.size >= collectionsList.length) {
          setIsLoading(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, name);
        loadedCollections.add(name);
        if (loadedCollections.size >= collectionsList.length) {
          setIsLoading(false);
        }
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Sync currentUser with allUsers in real-time to reflect role/permission changes
  useEffect(() => {
    if (currentUser) {
      const updatedUser = allUsers.find(u => u.id === currentUser.id);
      if (updatedUser) {
        const hasChanged = 
          updatedUser.role !== currentUser.role || 
          JSON.stringify(updatedUser.permissions) !== JSON.stringify(currentUser.permissions) ||
          updatedUser.name !== currentUser.name ||
          updatedUser.avatar !== currentUser.avatar ||
          updatedUser.tenantId !== currentUser.tenantId;

        if (hasChanged) {
          setCurrentUser(updatedUser);
          localStorage.setItem('resto_keep_user', JSON.stringify(updatedUser));
        }
      }
    }
  }, [allUsers, currentUser?.id]);

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

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const users = useMemo(() => {
    if (currentUser?.role === Role.SUPER_ADMIN) return allUsers;
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

  const recipes = useMemo(() => {
    const targetId = currentUser?.tenantId || currentTenantId;
    return allRecipes.filter(r => String(r.tenantId) === String(targetId));
  }, [allRecipes, currentUser, currentTenantId]);


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
      localStorage.setItem('resto_keep_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('resto_keep_user');
  };

  const addOrder = async (order: Omit<Order, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newOrder = { ...order, tenantId } as Order;
    
    try {
      const batch = writeBatch(db);
      
      // Add order
      const orderRef = doc(db, 'orders', newOrder.id);
      batch.set(orderRef, cleanObject({
        ...newOrder,
        createdAt: serverTimestamp()
      }));

    // Update menu item stock and validate
    const inventoryUpdates: { [id: string]: number } = {};
    const menuUpdates: { [id: string]: number } = {};

    for (const item of newOrder.items) {
      const menuItem = allMenu.find(m => m.id === item.itemId);
      if (menuItem && menuItem.stock !== undefined && menuItem.stock !== null) {
        const currentMenuStock = menuUpdates[item.itemId] !== undefined ? menuUpdates[item.itemId] : menuItem.stock;
        if (currentMenuStock < item.quantity) {
          throw new Error(`Insufficient stock for ${menuItem.name}`);
        }
        menuUpdates[item.itemId] = Math.max(0, currentMenuStock - item.quantity);

        // Sync with inventory if linked (Direct link or Category link)
        const recipe = recipes.find(r => r.menuItemId === item.itemId);
        if (recipe) {
          for (const ingredient of recipe.ingredients) {
            const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
            if (invItem) {
              const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
              inventoryUpdates[invItem.id] = Math.max(0, currentInvQty - (ingredient.quantity * item.quantity));
            }
          }
        } else {
          const linkedInvItem = allInventory.find(inv => 
            inv.menuItemId === item.itemId || 
            (inv.menuCategory === menuItem.category && !inv.menuItemId)
          );
          if (linkedInvItem) {
            const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
            const newInvQty = Math.max(0, currentInvQty - item.quantity);
            inventoryUpdates[linkedInvItem.id] = newInvQty;

            if (linkedInvItem.menuCategory && !linkedInvItem.menuItemId) {
              const categoryItems = allMenu.filter(m => m.category === linkedInvItem.menuCategory);
              categoryItems.forEach(m => {
                menuUpdates[m.id] = newInvQty;
              });
            }
          }
        }
      }
    }

    // Apply updates to batch
    for (const [id, stock] of Object.entries(menuUpdates)) {
      batch.update(doc(db, 'menu_items', id), { stock });
    }
    for (const [id, quantity] of Object.entries(inventoryUpdates)) {
      batch.update(doc(db, 'inventory_items', id), { quantity, lastUpdated: serverTimestamp() });
    }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      throw error; // Re-throw to handle in UI
    }
  };

  const updateOrderItems = async (
    orderId: string, 
    items: OrderItem[], 
    totalAmount: number, 
    note?: string, 
    status?: OrderStatus,
    deliveryStaffId?: string | null,
    deliveryStaffName?: string | null,
    deliveryStaffMobile?: string | null,
    deliveryAddress?: string | null
  ) => {
    const oldOrder = allOrders.find(o => o.id === orderId);
    if (!oldOrder) return;

    const newStatus = status ?? oldOrder.status;

    // Calculate stock changes
    const stockChanges: { [itemId: string]: number } = {};
    items.forEach(newItem => {
      const oldItem = oldOrder.items.find(oi => oi.itemId === newItem.itemId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const diff = newItem.quantity - oldQty;
      if (diff !== 0) stockChanges[newItem.itemId] = (stockChanges[newItem.itemId] || 0) + diff;
    });
    oldOrder.items.forEach(oldItem => {
      const newItem = items.find(ni => ni.itemId === oldItem.itemId);
      if (!newItem) stockChanges[oldItem.itemId] = (stockChanges[oldItem.itemId] || 0) - oldItem.quantity;
    });

    try {
      const batch = writeBatch(db);
      
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, cleanObject({
        items,
        totalAmount,
        status: newStatus,
        note: note ?? oldOrder.note ?? null,
        deliveryStaffId: deliveryStaffId !== undefined ? deliveryStaffId : (oldOrder.deliveryStaffId ?? null),
        deliveryStaffName: deliveryStaffName !== undefined ? deliveryStaffName : (oldOrder.deliveryStaffName ?? null),
        deliveryStaffMobile: deliveryStaffMobile !== undefined ? deliveryStaffMobile : (oldOrder.deliveryStaffMobile ?? null),
        deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : (oldOrder.deliveryAddress ?? null)
      }));

      // Update stock in Firestore and validate
      const inventoryUpdates: { [id: string]: number } = {};
      const menuUpdates: { [id: string]: number } = {};

      for (const itemId in stockChanges) {
        const change = stockChanges[itemId];
        const menuItem = allMenu.find(m => m.id === itemId);
        if (menuItem && menuItem.stock !== undefined && menuItem.stock !== null) {
          const currentMenuStock = menuUpdates[itemId] !== undefined ? menuUpdates[itemId] : menuItem.stock;
          if (change > 0 && currentMenuStock < change) {
            throw new Error(`Insufficient stock for ${menuItem.name}`);
          }
          menuUpdates[itemId] = Math.max(0, currentMenuStock - change);

          // Sync with inventory if linked (Direct link or Category link)
          const recipe = recipes.find(r => r.menuItemId === itemId);
          if (recipe) {
            for (const ingredient of recipe.ingredients) {
              const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
              if (invItem) {
                const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
                inventoryUpdates[invItem.id] = Math.max(0, currentInvQty - (ingredient.quantity * change));
              }
            }
          } else {
            const linkedInvItem = allInventory.find(inv => 
              inv.menuItemId === itemId || 
              (inv.menuCategory === menuItem.category && !inv.menuItemId)
            );
            if (linkedInvItem) {
              const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
              const newInvQty = Math.max(0, currentInvQty - change);
              inventoryUpdates[linkedInvItem.id] = newInvQty;

              if (linkedInvItem.menuCategory && !linkedInvItem.menuItemId) {
                const categoryItems = allMenu.filter(m => m.category === linkedInvItem.menuCategory);
                categoryItems.forEach(m => {
                  menuUpdates[m.id] = newInvQty;
                });
              }
            }
          }
        }
      }

      for (const [id, stock] of Object.entries(menuUpdates)) {
        batch.update(doc(db, 'menu_items', id), { stock });
      }
      for (const [id, quantity] of Object.entries(inventoryUpdates)) {
        batch.update(doc(db, 'inventory_items', id), { quantity, lastUpdated: serverTimestamp() });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, discount?: number) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      
      const updatedItems = order.items.map(i => ({ ...i, status: status as unknown as ItemStatus }));
      const updates: any = {
        status,
        items: updatedItems
      };
      if (discount !== undefined) updates.discount = discount;

      batch.update(orderRef, updates);

      // If order is cancelled, return items to stock
      if (status === OrderStatus.CANCELLED) {
        const inventoryUpdates: { [id: string]: number } = {};
        const menuUpdates: { [id: string]: number } = {};

        for (const item of order.items) {
          const menuItem = allMenu.find(m => m.id === item.itemId);
          if (menuItem && menuItem.stock !== undefined) {
            const currentMenuStock = menuUpdates[item.itemId] !== undefined ? menuUpdates[item.itemId] : menuItem.stock;
            menuUpdates[item.itemId] = currentMenuStock + item.quantity;

            // Sync with inventory if linked (Direct link or Category link)
            const recipe = recipes.find(r => r.menuItemId === item.itemId);
            if (recipe) {
              for (const ingredient of recipe.ingredients) {
                const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
                if (invItem) {
                  const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
                  inventoryUpdates[invItem.id] = currentInvQty + (ingredient.quantity * item.quantity);
                }
              }
            } else {
              const linkedInvItem = allInventory.find(inv => 
                inv.menuItemId === item.itemId || 
                (inv.menuCategory === menuItem.category && !inv.menuItemId)
              );
              if (linkedInvItem) {
                const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
                const newInvQty = currentInvQty + item.quantity;
                inventoryUpdates[linkedInvItem.id] = newInvQty;

                if (linkedInvItem.menuCategory && !linkedInvItem.menuItemId) {
                  const categoryItems = allMenu.filter(m => m.category === linkedInvItem.menuCategory);
                  categoryItems.forEach(m => {
                    menuUpdates[m.id] = newInvQty;
                  });
                }
              }
            }
          }
        }

        for (const [id, stock] of Object.entries(menuUpdates)) {
          batch.update(doc(db, 'menu_items', id), { stock });
        }
        for (const [id, quantity] of Object.entries(inventoryUpdates)) {
          batch.update(doc(db, 'inventory_items', id), { quantity, lastUpdated: serverTimestamp() });
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrderItemStatus = async (orderId: string, rowId: string, status: ItemStatus) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = order.items.map(i => i.rowId === rowId ? { ...i, status } : i);
    let newOrderStatus = order.status;
    const allReady = newItems.every(i => i.status === OrderStatus.READY);
    const anyPreparing = newItems.some(i => i.status === OrderStatus.PREPARING);
    const allCancelled = newItems.every(i => i.status === OrderStatus.CANCELLED);

    if (allCancelled) newOrderStatus = OrderStatus.CANCELLED;
    else if (allReady) newOrderStatus = OrderStatus.READY;
    else if (anyPreparing) newOrderStatus = OrderStatus.PREPARING;
    else newOrderStatus = OrderStatus.PENDING;

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      
      batch.update(orderRef, {
        items: newItems,
        status: newOrderStatus
      });

      // If item is cancelled, return to stock
      const itemToUpdate = order.items.find(i => i.rowId === rowId);
      if (itemToUpdate && status === OrderStatus.CANCELLED && itemToUpdate.status !== OrderStatus.CANCELLED) {
        const menuItem = allMenu.find(m => m.id === itemToUpdate.itemId);
        if (menuItem && menuItem.stock !== undefined) {
          const newStock = menuItem.stock + itemToUpdate.quantity;
          const itemRef = doc(db, 'menu_items', itemToUpdate.itemId);
          batch.update(itemRef, { stock: newStock });

          // Sync with inventory if linked (Direct link or Category link)
          const recipe = recipes.find(r => r.menuItemId === itemToUpdate.itemId);
          if (recipe) {
            for (const ingredient of recipe.ingredients) {
              const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
              if (invItem) {
                const invRef = doc(db, 'inventory_items', invItem.id);
                batch.update(invRef, { 
                  quantity: invItem.quantity + (ingredient.quantity * itemToUpdate.quantity),
                  lastUpdated: serverTimestamp()
                });
              }
            }
          } else {
            const linkedInvItem = allInventory.find(inv => 
              inv.menuItemId === itemToUpdate.itemId || 
              (inv.menuCategory === menuItem.category && !inv.menuItemId)
            );
            if (linkedInvItem) {
              const newInvQty = linkedInvItem.quantity + itemToUpdate.quantity;
              const invRef = doc(db, 'inventory_items', linkedInvItem.id);
              batch.update(invRef, { 
                quantity: newInvQty,
                lastUpdated: serverTimestamp()
              });

              if (linkedInvItem.menuCategory && !linkedInvItem.menuItemId) {
                const categoryItems = allMenu.filter(m => m.category === linkedInvItem.menuCategory);
                categoryItems.forEach(m => {
                  const mRef = doc(db, 'menu_items', m.id);
                  batch.update(mRef, { stock: newInvQty });
                });
              }
            }
          }
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateInventory = async (itemId: string, quantityChange: number) => {
    try {
      const item = allInventory.find(i => i.id === itemId);
      if (item) {
        const batch = writeBatch(db);
        const itemRef = doc(db, 'inventory_items', itemId);
        const newQuantity = Math.max(0, item.quantity + quantityChange);
        batch.update(itemRef, {
          quantity: newQuantity,
          lastUpdated: serverTimestamp()
        });

        // Sync with menu item if linked (Direct link or Category link)
        if (item.menuItemId) {
          const menuRef = doc(db, 'menu_items', item.menuItemId);
          batch.update(menuRef, { stock: newQuantity });
        } else if (item.menuCategory) {
          const categoryItems = allMenu.filter(m => m.category === item.menuCategory);
          categoryItems.forEach(m => {
            const menuRef = doc(db, 'menu_items', m.id);
            batch.update(menuRef, { stock: newQuantity });
          });
        }

        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory_items/${itemId}`);
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newItem = { ...item, tenantId } as InventoryItem;
    
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'inventory_items', newItem.id);
      batch.set(itemRef, cleanObject({
        ...newItem,
        lastUpdated: serverTimestamp()
      }));

      // If linked to a menu item or category, sync initial quantity
      if (newItem.menuItemId) {
        const menuRef = doc(db, 'menu_items', newItem.menuItemId);
        batch.update(menuRef, { stock: newItem.quantity });
      } else if (newItem.menuCategory) {
        const categoryItems = allMenu.filter(m => m.category === newItem.menuCategory);
        categoryItems.forEach(m => {
          const menuRef = doc(db, 'menu_items', m.id);
          batch.update(menuRef, { stock: newItem.quantity });
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory_items');
    }
  };

  const editInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'inventory_items', id);
      batch.update(itemRef, cleanObject({
        ...updates,
        lastUpdated: serverTimestamp()
      }));

      // If quantity is updated and linked to a menu item or category, sync it
      if (updates.quantity !== undefined) {
        const item = allInventory.find(i => i.id === id);
        const menuItemId = updates.menuItemId !== undefined ? updates.menuItemId : item?.menuItemId;
        const menuCategory = updates.menuCategory !== undefined ? updates.menuCategory : item?.menuCategory;
        
        if (menuItemId) {
          const menuRef = doc(db, 'menu_items', menuItemId);
          batch.update(menuRef, { stock: updates.quantity });
        } else if (menuCategory) {
          const categoryItems = allMenu.filter(m => m.category === menuCategory);
          categoryItems.forEach(m => {
            const menuRef = doc(db, 'menu_items', m.id);
            batch.update(menuRef, { stock: updates.quantity });
          });
        }
      } else if (updates.menuItemId !== undefined || updates.menuCategory !== undefined) {
        // If only link is updated, sync current quantity to menu item(s)
        const item = allInventory.find(i => i.id === id);
        if (item) {
          const menuItemId = updates.menuItemId !== undefined ? updates.menuItemId : item.menuItemId;
          const menuCategory = updates.menuCategory !== undefined ? updates.menuCategory : item.menuCategory;
          
          if (menuItemId) {
            const menuRef = doc(db, 'menu_items', menuItemId);
            batch.update(menuRef, { stock: item.quantity });
          } else if (menuCategory) {
            const categoryItems = allMenu.filter(m => m.category === menuCategory);
            categoryItems.forEach(m => {
              const menuRef = doc(db, 'menu_items', m.id);
              batch.update(menuRef, { stock: item.quantity });
            });
          }
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory_items/${id}`);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const itemRef = doc(db, 'inventory_items', id);
      await deleteDoc(itemRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory_items/${id}`);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newItem = { ...item, tenantId } as MenuItem;
    
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'menu_items', newItem.id);

      // Check if there's a category-linked inventory item
      const linkedInvItem = allInventory.find(inv => inv.menuCategory === newItem.category && !inv.menuItemId);
      if (linkedInvItem && newItem.stock === undefined) {
        newItem.stock = linkedInvItem.quantity;
      }

      batch.set(itemRef, cleanObject(newItem));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'menu_items');
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'menu_items', itemId);

      if (updates.category) {
        const linkedInvItem = allInventory.find(inv => inv.menuCategory === updates.category && !inv.menuItemId);
        if (linkedInvItem && updates.stock === undefined) {
          updates.stock = linkedInvItem.quantity;
        }
      }

      batch.update(itemRef, cleanObject(updates));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu_items/${itemId}`);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const itemRef = doc(db, 'menu_items', itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menu_items/${itemId}`);
    }
  };

  const addMenuCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = [...(tenant.menuCategories || []), catName];
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, { menuCategories: newCategories });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const renameMenuCategory = async (oldName: string, newName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = (tenant.menuCategories || []).map(c => c === oldName ? newName : c);
    try {
      const batch = writeBatch(db);
      const tenantRef = doc(db, 'tenants', tenantId);
      batch.update(tenantRef, { menuCategories: newCategories });

      // Update items in this category
      const itemsToUpdate = allMenu.filter(item => item.tenantId === tenantId && item.category === oldName);
      itemsToUpdate.forEach(item => {
        const itemRef = doc(db, 'menu_items', item.id);
        batch.update(itemRef, { category: newName });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const deleteMenuCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = (tenant.menuCategories || []).filter(c => c !== catName);
    try {
      const batch = writeBatch(db);
      const tenantRef = doc(db, 'tenants', tenantId);
      batch.update(tenantRef, { menuCategories: newCategories });

      // Update items in this category to 'Uncategorized'
      const itemsToUpdate = allMenu.filter(item => item.tenantId === tenantId && item.category === catName);
      itemsToUpdate.forEach(item => {
        const itemRef = doc(db, 'menu_items', item.id);
        batch.update(itemRef, { category: 'Uncategorized' });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const addExpenseCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = [...tenant.expenseCategories, catName];
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, { expenseCategories: newCategories });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const renameExpenseCategory = async (oldName: string, newName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = tenant.expenseCategories.map(c => c === oldName ? newName : c);
    try {
      const batch = writeBatch(db);
      const tenantRef = doc(db, 'tenants', tenantId);
      batch.update(tenantRef, { expenseCategories: newCategories });

      // Update expenses in this category
      const expensesToUpdate = allExpenses.filter(e => e.tenantId === tenantId && e.category === oldName);
      expensesToUpdate.forEach(e => {
        const expenseRef = doc(db, 'expenses', e.id);
        batch.update(expenseRef, { category: newName });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const deleteExpenseCategory = async (catName: string) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const newCategories = tenant.expenseCategories.filter(c => c !== catName);
    try {
      const batch = writeBatch(db);
      const tenantRef = doc(db, 'tenants', tenantId);
      batch.update(tenantRef, { expenseCategories: newCategories });

      // Update expenses in this category to 'Other'
      const expensesToUpdate = allExpenses.filter(e => e.tenantId === tenantId && e.category === catName);
      expensesToUpdate.forEach(e => {
        const expenseRef = doc(db, 'expenses', e.id);
        batch.update(expenseRef, { category: 'Other' });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const addRecipe = async (recipe: Omit<Recipe, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newRecipe = { ...recipe, tenantId } as Recipe;
    try {
      const recipeRef = doc(db, 'recipes', newRecipe.id);
      await setDoc(recipeRef, cleanObject(newRecipe));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const recipeRef = doc(db, 'recipes', id);
      await updateDoc(recipeRef, cleanObject(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recipes/${id}`);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const recipeRef = doc(db, 'recipes', id);
      await deleteDoc(recipeRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
    }
  };

  const addUser = async (user: User | Omit<User, 'tenantId'>) => {
    const tenantId = (user as User).tenantId || currentUser?.tenantId || currentTenantId || '';
    const newUser = { 
      ...user, 
      tenantId,
      avatar: (user as User).avatar || DEFAULT_AVATAR
    } as User;
    
    try {
      const userRef = doc(db, 'users', newUser.id);
      await setDoc(userRef, cleanObject(newUser));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, cleanObject(updates), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
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

    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const updateBusiness = async (updates: Partial<Business>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const updateTenant = async (tenantId: string, updates: Partial<Business>) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete tenant
      batch.delete(doc(db, 'tenants', tenantId));

      // In a real app, we'd delete all sub-data too. 
      // Firestore doesn't support recursive deletes in a batch easily without knowing all IDs.
      // For this app, we'll just delete the tenant and assume the UI filters the rest.
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tenants/${tenantId}`);
    }
  };

  const toggleBusinessStatus = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, { isActive: !tenant.isActive });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const createBusiness = async (businessData: Partial<Business>, ownerData: Partial<User>, sourceTenantId?: string) => {
    const numericIds = tenants
      .map(t => parseInt(t.id))
      .filter(id => !isNaN(id))
      .sort((a, b) => b - a);
    
    const nextId = numericIds.length > 0 ? numericIds[0] + 1 : 1;
    const newTenantId = nextId < 10 ? `0${nextId}` : `${nextId}`;

    let initialMenuCategories = ['Main', 'Starter', 'Beverage', 'Dessert'];
    if (sourceTenantId) {
      const sourceTenant = tenants.find(t => t.id === sourceTenantId);
      if (sourceTenant && sourceTenant.menuCategories) {
        initialMenuCategories = [...sourceTenant.menuCategories];
      }
    }

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
      menuCategories: initialMenuCategories,
      customerTokenPrefix: 'ORD',
      nextCustomerToken: 1,
      customerAppEnabled: true,
      isActive: true,
      monthlyBill: businessData.monthlyBill || 500,
      createdAt: new Date().toISOString()
    };

    const newOwner: User = {
      id: `u-${Date.now()}`,
      tenantId: newTenantId,
      name: ownerData.name || 'Owner',
      email: ownerData.email || '',
      password: ownerData.password || '',
      mobile: ownerData.mobile || '',
      role: Role.OWNER,
      avatar: '',
      permissions: ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings']
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'tenants', newBusiness.id), newBusiness);
      batch.set(doc(db, 'users', newOwner.id), newOwner);

      if (sourceTenantId) {
        const sourceMenuItems = allMenu.filter(m => m.tenantId === sourceTenantId);
        sourceMenuItems.forEach((item, index) => {
          const newItemId = `m-${Date.now()}-${index}`;
          const newItem = {
            ...item,
            id: newItemId,
            tenantId: newTenantId
          };
          batch.set(doc(db, 'menu_items', newItemId), newItem);
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tenants/users');
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newTransaction = { ...transaction, tenantId } as Transaction;
    
    try {
      const transRef = doc(db, 'transactions', newTransaction.id);
      await setDoc(transRef, newTransaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'tenantId'>) => {
    const tenantId = currentUser?.tenantId || currentTenantId || '';
    const newExpense = { ...expense, tenantId } as Expense;
    
    try {
      const expenseRef = doc(db, 'expenses', newExpense.id);
      await setDoc(expenseRef, newExpense);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const expenseRef = doc(db, 'expenses', id);
      await deleteDoc(expenseRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const generateMonthlyBills = async (month: string): Promise<number> => {
    const activeTenants = tenants.filter(t => t.isActive);
    
    // Filter out tenants who already have a bill for this month (regardless of status)
    const tenantsToBill = activeTenants.filter(tenant => {
      const existingBill = monthlyBills.find(b => b.tenantId === tenant.id && b.month === month);
      return !existingBill;
    });

    if (tenantsToBill.length === 0) {
      return 0;
    }

    const billsToCreate: MonthlyBill[] = tenantsToBill.map(tenant => ({
      id: `bill-${tenant.id}-${month.replace(' ', '-')}-${Date.now()}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      month,
      amount: tenant.monthlyBill,
      status: BillStatus.PENDING,
      createdAt: new Date().toISOString()
    }));

    try {
      const batch = writeBatch(db);
      billsToCreate.forEach(bill => {
        batch.set(doc(db, 'monthly_bills', bill.id), bill);
      });
      await batch.commit();
      return billsToCreate.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'monthly_bills');
      return 0;
    }
  };

  const approveBill = async (billId: string) => {
    const approvedAt = new Date().toISOString();
    try {
      const billRef = doc(db, 'monthly_bills', billId);
      await updateDoc(billRef, {
        status: BillStatus.APPROVED,
        approvedAt
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `monthly_bills/${billId}`);
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
      deleteInventoryItem,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addMenuCategory,
      renameMenuCategory,
      deleteMenuCategory,
      addExpenseCategory,
      renameExpenseCategory,
      deleteExpenseCategory,
      recipes,
      addRecipe,
      updateRecipe,
      deleteRecipe,
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
      activeCategory,
      setActiveCategory,
      categories,
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
