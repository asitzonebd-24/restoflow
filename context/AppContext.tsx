
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus, Recipe, Table } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES, DEFAULT_MENU_IMAGE, DEFAULT_AVATAR, DEFAULT_BUSINESS_LOGO } from '../constants';
import { auth, secondaryAuth, db, googleProvider } from '../src/firebase';
import { 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { toast } from 'sonner';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit,
  orderBy,
  or,
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
      userId: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'anonymous',
      emailVerified: auth.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  
  const errorMsg = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMsg);
  
  // Show toast for user feedback
  if (errInfo.error.includes('insufficient permissions')) {
    toast.error('Permission Denied: You do not have access to this resource.');
  } else if (errInfo.error.includes('Quota exceeded')) {
    toast.error('Quota Exceeded: Please try again later.');
  } else {
    toast.error(`Operation failed: ${errInfo.error}`);
  }
  
  // Throw error if it's a permission or quota error so ErrorBoundary can catch it
  if (errInfo.error.includes('insufficient permissions') || errInfo.error.includes('Quota exceeded')) {
    throw new Error(errorMsg);
  }
};

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  business: Business;
  tenants: Business[];
  orders: Order[];
  inventory: InventoryItem[];
  menu: MenuItem[];
  login: (emailOrMobile: string, password: string, tenantId?: string | null) => Promise<boolean>;
  logout: () => Promise<void>;
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
  updateOrderItemStatus: (orderId: string, rowId: string | string[], status: ItemStatus) => Promise<void>;
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
  createBusiness: (businessData: Partial<Business>, ownerData: Partial<User>, sourceTenantId?: string) => Promise<string>;
  loginWithGoogle: () => Promise<void>;
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
  tables: Table[];
  addTable: (table: Omit<Table, 'tenantId'>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
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
  const [tenants, setTenants] = useState<Business[]>([BUSINESS_DETAILS]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>(ENHANCED_MOCK_USERS);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Global safety timeout to ensure the app always loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(current => {
        if (current) {
          console.warn('[AppContext] Global safety timeout reached. Forcing isLoading to false.');
          return false;
        }
        return current;
      });
      setIsAuthReady(current => {
        if (!current) {
          console.warn('[AppContext] Global safety timeout reached. Forcing isAuthReady to true.');
          return true;
        }
        return current;
      });
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(`[AppContext] isLoading changed to: ${isLoading}`);
  }, [isLoading]);
  const [activeCategory, setActiveCategory] = useState<string>('');
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
            setCurrentUser(userData);
            localStorage.setItem('resto_keep_user', JSON.stringify(userData));
          } else {
            // If no user doc exists, clear local state and sign out
            console.warn('User authenticated but no profile found in Firestore. Signing out...');
            setCurrentUser(null);
            localStorage.removeItem('resto_keep_user');
            await signOut(auth);
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('resto_keep_user');
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        setIsAuthReady(true);
      }
    });

    // Bootstrap Super Admin into Firestore if it doesn't exist
    const bootstrapSuperAdmin = async () => {
      try {
        const saEmail = 'asitzonebd@gmail.com';
        const saPassword = 'admin123'; // Match MOCK_USERS password
        
        // Try to sign in to see if the user exists in Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(secondaryAuth, saEmail, saPassword);
          
          // Check if Firestore doc exists
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (!userDoc.exists()) {
            console.log('Super Admin exists in Auth but missing in Firestore. Creating doc...');
            const saUser = MOCK_USERS.find(u => u.email === saEmail);
            if (saUser) {
              const newUser = { ...saUser, id: userCredential.user.uid };
              await setDoc(doc(db, 'users', newUser.id), newUser);
              console.log('Super Admin doc created successfully.');
            }
          }
          await signOut(secondaryAuth);
        } catch (e: any) {
          // If user doesn't exist or invalid credentials, try to create them
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.message.includes('invalid-credential')) {
            console.log('Bootstrapping Super Admin into Firebase Auth...');
            try {
              const userCredential = await createUserWithEmailAndPassword(secondaryAuth, saEmail, saPassword);
              
              const saUser = MOCK_USERS.find(u => u.email === saEmail);
              if (saUser) {
                const newUser = { ...saUser, id: userCredential.user.uid };
                await setDoc(doc(db, 'users', newUser.id), newUser);
                console.log('Super Admin bootstrapped successfully.');
              }
              await signOut(secondaryAuth);
            } catch (createError: any) {
              if (createError.code !== 'auth/email-already-in-use') {
                console.error('Failed to create Super Admin:', createError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error bootstrapping Super Admin:', error);
      }
    };

    bootstrapSuperAdmin();

    return () => unsubscribe();
  }, []);
  const convertFirestoreData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] instanceof Timestamp) {
        cleaned[key] = cleaned[key].toDate().toISOString();
      } else if (Array.isArray(cleaned[key])) {
        cleaned[key] = cleaned[key].map((item: any) => 
          (typeof item === 'object' && item !== null) ? convertFirestoreData(item) : item
        );
      } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
        cleaned[key] = convertFirestoreData(cleaned[key]);
      }
    });
    return cleaned;
  };

  const resolvedTenantId = useMemo(() => {
    const rawId = currentUser?.tenantId || currentTenantId;
    if (!rawId) return null;
    const tenantBySlug = tenants.find(t => t.slug === rawId || t.id === rawId);
    if (tenantBySlug) return tenantBySlug.id;
    return rawId;
  }, [currentUser?.tenantId, currentTenantId, tenants]);

  // 1. Tenants Listener (Global or Tenant-specific)
  useEffect(() => {
    if (!isAuthReady) return;

    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN;
    const rawTenantId = currentUser?.tenantId || currentTenantId;

    let tenantsQuery = query(collection(db, 'tenants'), limit(100));
    if (!isSuperAdmin && rawTenantId) {
      tenantsQuery = query(collection(db, 'tenants'), or(where('id', '==', rawTenantId), where('slug', '==', rawTenantId)), limit(1));
    } else if (!isSuperAdmin && !rawTenantId) {
      tenantsQuery = query(collection(db, 'tenants'), limit(10));
    }

    const unsubTenants = onSnapshot(tenantsQuery, (snapshot) => {
      const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...convertFirestoreData(doc.data()) })) as Business[];
      const uniqueTenantsMap = new Map<string, Business>();
      rawData.forEach(t => {
        const id = String(t.id);
        if (!uniqueTenantsMap.has(id)) uniqueTenantsMap.set(id, t);
      });
      
      const tenantsData = Array.from(uniqueTenantsMap.values());
      if (!tenantsData.some(t => String(t.id) === '01')) {
        if (isSuperAdmin || !rawTenantId || rawTenantId === '01') {
          tenantsData.unshift(BUSINESS_DETAILS);
        }
      }
      setTenants(tenantsData);
      
      if (!currentUser) {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error fetching tenants:', error);
      if (!currentUser) setIsLoading(false);
      setTenants([BUSINESS_DETAILS]);
    });

    return () => unsubTenants();
  }, [isAuthReady, currentUser?.role, currentTenantId]);

  // 2. Data Listeners (Dependent on resolvedTenantId)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const unsubscribers: (() => void)[] = [];
    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN;
    const effectiveTenantId = resolvedTenantId;

    const criticalCollections = ['users'];
    if (!isSuperAdmin || currentTenantId) {
      criticalCollections.push('transactions', 'expenses', 'orders', 'menu_items', 'inventory_items', 'tables');
    }
    
    const loadedCollections = new Set<string>();

    const checkLoadingState = (name: string) => {
      loadedCollections.add(name);
      if (criticalCollections.every(c => loadedCollections.has(c))) {
        setIsLoading(false);
      }
    };

    if (criticalCollections.length === 0) {
      setIsLoading(false);
    }

    const collections: { name: string, setter: (data: any) => void }[] = [
      { name: 'users', setter: setAllUsers },
      { name: 'monthly_bills', setter: setMonthlyBills }
    ];

    if (!isSuperAdmin || currentTenantId) {
      collections.push(
        { name: 'transactions', setter: setAllTransactions },
        { name: 'expenses', setter: setAllExpenses },
        { name: 'recipes', setter: setAllRecipes },
        { name: 'orders', setter: setAllOrders },
        { name: 'menu_items', setter: setAllMenu },
        { name: 'inventory_items', setter: setAllInventory },
        { name: 'tables', setter: setAllTables }
      );
    }

    collections.forEach(({ name, setter }) => {
      let q;
      if (!isSuperAdmin && effectiveTenantId) {
        q = query(collection(db, name), where('tenantId', '==', effectiveTenantId));
      } else {
        q = query(collection(db, name));
      }

      if (name === 'orders') {
        q = query(collection(db, name), ...(effectiveTenantId && !isSuperAdmin ? [where('tenantId', '==', effectiveTenantId)] : []), limit(500));
      }

      if (['transactions', 'expenses', 'monthly_bills'].includes(name)) {
        q = query(collection(db, name), ...(effectiveTenantId && !isSuperAdmin ? [where('tenantId', '==', effectiveTenantId)] : []), limit(1000));
      }

      const unsub = onSnapshot(q, (snapshot) => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...convertFirestoreData(doc.data()) }));
        if (['transactions', 'expenses', 'orders', 'monthly_bills'].includes(name)) {
          const sortField = name === 'orders' || name === 'monthly_bills' ? 'createdAt' : 'date';
          data.sort((a: any, b: any) => (b[sortField] || '').localeCompare(a[sortField] || ''));
        }
        setter(data as any);
        if (criticalCollections.includes(name)) checkLoadingState(name);
      }, (error) => {
        if (criticalCollections.includes(name)) checkLoadingState(name);
        if (!error.message.includes('Quota exceeded')) {
          console.error(`Error in listener for ${name}:`, error);
        }
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthReady, currentUser?.id, currentUser?.role, resolvedTenantId]);

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
    const targetId = resolvedTenantId;
    if (!targetId) return tenants[0] || BUSINESS_DETAILS;
    const found = tenants.find(t => String(t.id) === String(targetId));
    if (found) return found;
    
    // If we're at a specific tenant ID but it's not in the list yet, 
    // and we have a default business, only return it if the ID matches
    if (String(BUSINESS_DETAILS.id) === String(targetId)) return BUSINESS_DETAILS;
    
    // Return the first tenant as a fallback only if no specific ID was requested
    // and we are not in a "not found" state
    return tenants[0] || BUSINESS_DETAILS;
  }, [currentUser, tenants, resolvedTenantId]);

  const orders = useMemo(() => {
    const targetId = business.id;
    return allOrders.filter(o => String(o.tenantId || '01') === String(targetId));
  }, [allOrders, business.id]);

  const inventory = useMemo(() => {
    const targetId = business.id;
    return allInventory.filter(i => String(i.tenantId || '01') === String(targetId));
  }, [allInventory, business.id]);

  const menu = useMemo(() => {
    const targetId = business.id;
    return allMenu.filter(m => String(m.tenantId || '01') === String(targetId));
  }, [allMenu, business.id]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const users = useMemo(() => {
    if (currentUser?.role === Role.SUPER_ADMIN) return allUsers;
    const targetId = business.id;
    return allUsers.filter(u => String(u.tenantId || '01') === String(targetId) || u.role === Role.SUPER_ADMIN);
  }, [allUsers, currentUser, business.id]);

  const transactions = useMemo(() => {
    const targetId = business.id;
    return allTransactions.filter(t => String(t.tenantId || '01') === String(targetId));
  }, [allTransactions, business.id]);

  const expenses = useMemo(() => {
    const targetId = business.id;
    return allExpenses.filter(e => String(e.tenantId || '01') === String(targetId));
  }, [allExpenses, business.id]);

  const recipes = useMemo(() => {
    const targetId = business.id;
    return allRecipes.filter(r => String(r.tenantId || '01') === String(targetId));
  }, [allRecipes, business.id]);

  const tables = useMemo(() => {
    const targetId = business.id;
    return allTables.filter(t => String(t.tenantId || '01') === String(targetId));
  }, [allTables, business.id]);

  const addTable = async (table: Omit<Table, 'tenantId'>) => {
    const tenantId = resolvedTenantId || '';
    const newTable = { ...table, tenantId } as Table;
    try {
      await setDoc(doc(db, 'tables', newTable.id), cleanObject({
        ...newTable,
        createdAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tables');
      throw error;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tables/${id}`);
      throw error;
    }
  };


  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
        setCurrentUser(userData);
        localStorage.setItem('resto_keep_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
        return true;
      } else {
        // If it's a new user via Google, we might want to create a profile or deny access
        // For now, we'll deny access if they aren't already in the system
        // unless they are a customer (we could auto-create customer profiles)
        toast.error('No account found with this Google profile. Please register first.');
        await signOut(auth);
        return false;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Google login failed: ' + error.message);
      }
      return false;
    }
  };

  const login = async (emailOrMobile: string, password: string, tenantId?: string | null): Promise<boolean> => {
    setIsLoading(true);
    console.log('Login attempt for:', emailOrMobile);
    try {
      let emailToUse = emailOrMobile.toLowerCase();
      
      // If it's a mobile number, lookup the email first
      if (!emailOrMobile.includes('@')) {
        // Since we can't query users without auth, we assume it's a customer mobile login
        // or a staff member who was created with a mobile-based email.
        emailToUse = `${emailOrMobile}@customer.com`;
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setIsLoading(false);
        toast.error('User profile not found.');
        return false;
      }

      const user = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
      
      if (user) {
        // If a specific tenantId is provided in the URL, verify the user belongs to it
        if (tenantId && user.tenantId && String(user.tenantId) !== String(tenantId) && user.role !== Role.SUPER_ADMIN) {
          console.warn('Access denied: tenant mismatch', { userTenant: user.tenantId, targetTenant: tenantId });
          await signOut(auth);
          setIsLoading(false);
          toast.error('Access denied for this restaurant.');
          return false;
        }
        
        if (!tenantId && user.role !== Role.SUPER_ADMIN && !user.tenantId) {
          console.warn('Access denied: no tenant for non-superadmin');
          await signOut(auth);
          setIsLoading(false);
          toast.error('Invalid account configuration.');
          return false;
        }

        setCurrentUser(user);
        localStorage.setItem('resto_keep_user', JSON.stringify(user));
        toast.success(`Welcome back, ${user.name}!`);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed login attempts. Please wait a few minutes and try again.');
      } else {
        toast.error('Login failed: ' + (error.message || 'Invalid credentials'));
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
    localStorage.removeItem('resto_keep_user');
    toast.success('Logged out successfully');
  };

  const addOrder = async (order: Omit<Order, 'tenantId'>) => {
    const tenantId = resolvedTenantId || '';
    const newOrder = { ...order, tenantId } as Order;
    
    console.log('Attempting to add order:', newOrder);

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

  const updateOrderItemStatus = async (orderId: string, rowId: string | string[], status: ItemStatus) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const rowIds = Array.isArray(rowId) ? rowId : [rowId];
    const newItems = order.items.map(i => rowIds.includes(i.rowId) ? { ...i, status } : i);
    
    // Recalculate total amount excluding cancelled items
    const newTotalAmount = newItems.reduce((sum, item) => {
      if (item.status === OrderStatus.CANCELLED) return sum;
      return sum + (item.price * item.quantity);
    }, 0);

    let newOrderStatus = order.status;
    const allReady = newItems.every(i => i.status === OrderStatus.READY || i.status === OrderStatus.CANCELLED);
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
        status: newOrderStatus,
        totalAmount: newTotalAmount
      });

      // If items are cancelled, return to stock
      const itemsToUpdate = order.items.filter(i => rowIds.includes(i.rowId));
      for (const itemToUpdate of itemsToUpdate) {
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
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
    const tenantId = resolvedTenantId || '';
    const newRecipe = { ...recipe, tenantId } as Recipe;
    try {
      const recipeRef = doc(db, 'recipes', newRecipe.id);
      await setDoc(recipeRef, cleanObject(newRecipe));
      setAllRecipes(prev => [...prev, newRecipe]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const recipeRef = doc(db, 'recipes', id);
      await updateDoc(recipeRef, cleanObject(updates));
      setAllRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recipes/${id}`);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const recipeRef = doc(db, 'recipes', id);
      await deleteDoc(recipeRef);
      setAllRecipes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
    }
  };

  const addUser = async (user: User | Omit<User, 'tenantId'>) => {
    const tenantId = (user as User).tenantId || resolvedTenantId || '';
    
    try {
      // Create user in Firebase Auth using secondary app to avoid signing out current user
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
      
      const newUser = { 
        ...user, 
        id: userCredential.user.uid,
        tenantId,
        avatar: (user as User).avatar || DEFAULT_AVATAR
      } as User;
      
      // Save user profile to Firestore
      const userRef = doc(db, 'users', newUser.id);
      await setDoc(userRef, cleanObject(newUser));
      setAllUsers(prev => [...prev, newUser]);
      
      // Sign out the secondary auth instance
      await signOut(secondaryAuth);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + error.message);
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, cleanObject(updates), { merge: true });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
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
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const updateBusiness = async (updates: Partial<Business>) => {
    const tenantId = resolvedTenantId || '';
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, updates);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const updateTenant = async (tenantId: string, updates: Partial<Business>) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, updates);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete tenant
      batch.delete(doc(db, 'tenants', tenantId));

      // Delete associated users
      const tenantUsers = allUsers.filter(u => u.tenantId === tenantId);
      tenantUsers.forEach(u => {
        batch.delete(doc(db, 'users', u.id));
      });
      
      await batch.commit();
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      setAllUsers(prev => prev.filter(u => u.tenantId !== tenantId));
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

  const createBusiness = async (businessData: Partial<Business>, ownerData: Partial<User>, sourceTenantId?: string): Promise<string> => {
    // We need to get the latest tenants to avoid ID collisions if called sequentially
    let currentTenants = tenants;
    try {
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      currentTenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...convertFirestoreData(doc.data()) })) as Business[];
    } catch (err) {
      console.error('Error fetching latest tenants for ID generation:', err);
    }

    const numericIds = currentTenants
      .map(t => parseInt(t.id))
      .filter(id => !isNaN(id))
      .sort((a, b) => b - a);
    
    const nextId = numericIds.length > 0 ? numericIds[0] + 1 : 1;
    const generatedTenantId = nextId < 10 ? `0${nextId}` : `${nextId}`;
    const newTenantId = generatedTenantId;

    let initialMenuCategories = ['Main', 'Starter', 'Beverage', 'Dessert'];
    if (sourceTenantId) {
      const sourceTenant = tenants.find(t => t.id === sourceTenantId);
      if (sourceTenant && sourceTenant.menuCategories) {
        initialMenuCategories = [...sourceTenant.menuCategories];
      }
    }

    const newBusiness: Business = {
      id: newTenantId,
      slug: businessData.slug || newTenantId,
      name: businessData.name || 'New Restaurant',
      logo: businessData.logo || DEFAULT_BUSINESS_LOGO,
      address: businessData.address || '',
      phone: businessData.phone || '',
      currency: businessData.currency || '$',
      vatRate: businessData.vatRate || 0,
      includeVat: businessData.includeVat || false,
      timezone: businessData.timezone || 'UTC',
      themeColor: businessData.themeColor || '#0f172a',
      expenseCategories: businessData.expenseCategories || ['Inventory', 'Utilities', 'Salaries', 'Other'],
      menuCategories: initialMenuCategories,
      customerTokenPrefix: businessData.customerTokenPrefix || 'ORD',
      nextCustomerToken: businessData.nextCustomerToken || 1,
      customerAppEnabled: businessData.customerAppEnabled ?? true,
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

      // Optimistic update for local state
      setTenants(prev => {
        if (prev.some(t => t.id === newBusiness.id)) return prev;
        return [...prev, newBusiness];
      });
      setAllUsers(prev => {
        if (prev.some(u => u.id === newOwner.id)) return prev;
        return [...prev, newOwner];
      });
      
      toast.success(`Business "${newBusiness.name}" created successfully!`);
      return newTenantId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tenants/users');
      return '';
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'tenantId'>) => {
    const tenantId = resolvedTenantId || '';
    const newTransaction = { ...transaction, tenantId } as Transaction;
    
    try {
      const transRef = doc(db, 'transactions', newTransaction.id);
      await setDoc(transRef, cleanObject(newTransaction));
      setAllTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'tenantId'>) => {
    const tenantId = resolvedTenantId || '';
    const newExpense = { ...expense, tenantId } as Expense;
    
    try {
      const expenseRef = doc(db, 'expenses', newExpense.id);
      await setDoc(expenseRef, cleanObject(newExpense));
      setAllExpenses(prev => [newExpense, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const expenseRef = doc(db, 'expenses', id);
      await deleteDoc(expenseRef);
      setAllExpenses(prev => prev.filter(e => e.id !== id));
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
      setMonthlyBills(prev => [...prev, ...billsToCreate]);
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

      // Local state update
      setMonthlyBills(prev =>
        prev.map(b =>
          b.id === billId
            ? { ...b, status: BillStatus.APPROVED, approvedAt }
            : b
        )
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `monthly_bills/${billId}`
      );
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
      loginWithGoogle,
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
      dbStatus,
      tables,
      addTable,
      deleteTable
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
