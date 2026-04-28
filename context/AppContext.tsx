
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus, Recipe, Table, InventoryMode, SubscriptionPackage } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES, DEFAULT_MENU_IMAGE, DEFAULT_AVATAR, DEFAULT_BUSINESS_LOGO, APP_MODULES } from '../constants';
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
  Timestamp,
  addDoc
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
  createPrintRequest: (order: Order, type?: 'kot' | 'invoice') => Promise<void>;
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
  updateOrderPaymentStatus: (orderId: string, isPaid: boolean) => Promise<void>;
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
  updateMenuCategories: (categories: string[]) => void;
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
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
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
  markBillAsPaid: (billId: string, txnId: string) => Promise<void>;
  subscriptionPackages: SubscriptionPackage[];
  addSubscriptionPackage: (pkg: Omit<SubscriptionPackage, 'id' | 'createdAt'>) => Promise<void>;
  updateSubscriptionPackage: (id: string, pkg: Partial<SubscriptionPackage>) => Promise<void>;
  deleteSubscriptionPackage: (id: string) => Promise<void>;
  subscribeBusinessToPackage: (tenantId: string, packageId: string) => Promise<void>;
  allUsers: User[];
  isLoading: boolean;
  isAuthReady: boolean;
  getDefaultRedirect: () => string;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  categories: string[];
  relayMode: boolean;
  setRelayMode: (active: boolean) => void;
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

const cleanObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject);
  
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    const val = newObj[key];
    if (val === undefined || val === null) {
      delete newObj[key];
    } else if (typeof val === 'number' && isNaN(val)) {
      newObj[key] = 0;
    } else if (typeof val === 'object' && !(val instanceof Date) && !val._methodName) {
      newObj[key] = cleanObject(val);
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
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTenantId) {
      console.log('[AppContext] currentTenantId updated to:', currentTenantId);
    }
  }, [currentTenantId]);
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
  const [subscriptionPackages, setSubscriptionPackages] = useState<SubscriptionPackage[]>([]);
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
    }, 10000); // Increased to 10s for slower connections
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(`[AppContext] State Update - isLoading: ${isLoading}, isAuthReady: ${isAuthReady}, currentUser: ${currentUser?.email || 'null'}`);
  }, [isLoading, isAuthReady, currentUser]);
  const [activeCategory, setActiveCategory] = useState<string>('Select Categories');
  const [relayMode, setRelayMode] = useState<boolean>(() => {
    return localStorage.getItem('mobile_printer_relay_active') === 'true';
  });

  const toggleRelayMode = (active: boolean) => {
    setRelayMode(active);
    localStorage.setItem('mobile_printer_relay_active', String(active));
    if (active) {
      toast.info('Mobile Printer Relay Activated');
    } else {
      toast.info('Mobile Printer Relay Deactivated');
    }
  };

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
          // Fetch user profile from Firestore with retries
          let retries = 0;
          const maxRetries = 2;
          let userDoc = null;

          while (retries <= maxRetries) {
            try {
              userDoc = await getDoc(doc(db, 'users', user.uid));
              break;
            } catch (err) {
              retries++;
              if (retries > maxRetries) throw err;
              await new Promise(res => setTimeout(res, 1000));
            }
          }

          if (userDoc && userDoc.exists()) {
            const userData = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
            setCurrentUser(userData);
            localStorage.setItem('resto_keep_user', JSON.stringify(userData));
          } else {
            // Profile not found in Firestore. 
            // Check if we already have a user in state (maybe from localStorage)
            // and only log out if it's definitely a different UID or if we're sure it's an orphan auth account.
            const savedUser = localStorage.getItem('resto_keep_user');
            const parsedSavedUser = savedUser ? JSON.parse(savedUser) : null;
            
            if (!parsedSavedUser || parsedSavedUser.id !== user.uid) {
              console.warn('User authenticated but no profile found in Firestore. Signing out...');
              setCurrentUser(null);
              localStorage.removeItem('resto_keep_user');
              await signOut(auth);
            } else {
              console.warn('Firestore profile fetch failed but UID matches saved user. Retaining session for now.');
            }
          }
        } else {
          // Firebase says user is null.
          // Only clear if we are sure we are not in a transient disconnect state
          // but usually onAuthStateChanged null means signed out.
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
      // Only run once per browser to avoid "too many login attempts" from Firebase Auth
      if (localStorage.getItem('sa_bootstrapped')) return;

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
          localStorage.setItem('sa_bootstrapped', 'true');
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
              localStorage.setItem('sa_bootstrapped', 'true');
            } catch (createError: any) {
              if (createError.code === 'auth/email-already-in-use') {
                localStorage.setItem('sa_bootstrapped', 'true');
              } else if (createError.code === 'auth/too-many-requests') {
                console.warn('Too many login attempts. Skipping bootstrap for now.');
              } else {
                console.error('Failed to create Super Admin:', createError);
              }
            }
          } else if (e.code === 'auth/too-many-requests') {
            console.warn('Too many login attempts. Skipping bootstrap for now.');
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
    let rawId = activeTenantId;
    if (!rawId) {
      if (currentUser?.tenantIds && currentTenantId && currentUser.tenantIds.includes(currentTenantId)) {
        rawId = currentTenantId;
      } else if (currentUser?.role === Role.SUPER_ADMIN && currentTenantId && currentTenantId !== '00' && currentTenantId !== '01') {
        rawId = currentTenantId;
      } else {
        rawId = currentUser?.tenantId || currentTenantId;
      }
    }
    
    if (!rawId) return null;
    const tenantBySlug = tenants.find(t => t.slug === rawId || t.id === rawId);
    if (tenantBySlug) return tenantBySlug.id;
    return rawId;
  }, [activeTenantId, currentUser, currentTenantId, tenants]);

  // Reset loading state when tenant context changes to ensure fresh data fetch
  useEffect(() => {
    if (resolvedTenantId) {
      console.log('[AppContext] Tenant context changed, resetting loading state:', resolvedTenantId);
      setIsLoading(true);
    }
  }, [resolvedTenantId]);

  // 1. Tenants Listener (Global or Tenant-specific)
  useEffect(() => {
    if (!isAuthReady) return;

    // If no user is logged in, we should stop loading quickly to show the landing/login pages
    let timer: NodeJS.Timeout;
    if (!currentUser) {
      timer = setTimeout(() => {
        setIsLoading(current => {
          if (current) {
            console.log('[AppContext] No user detected, stopping load after 3s timeout');
            return false;
          }
          return current;
        });
      }, 3000);
    }

    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN;
    const rawTenantId = currentTenantId || currentUser?.tenantId;

    let tenantsQuery = query(collection(db, 'tenants'), limit(100));
    if (!isSuperAdmin) {
      if (currentUser?.tenantIds && currentUser.tenantIds.length > 0) {
        // Fetch up to 10 tenants if they have multiple
        const idsToFetch = currentUser.tenantIds.slice(0, 10);
        tenantsQuery = query(collection(db, 'tenants'), where('id', 'in', idsToFetch));
      } else if (rawTenantId) {
        tenantsQuery = query(collection(db, 'tenants'), or(where('id', '==', rawTenantId), where('slug', '==', rawTenantId)), limit(1));
      } else {
        tenantsQuery = query(collection(db, 'tenants'), limit(10));
      }
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

    return () => {
      if (timer) clearTimeout(timer);
      unsubTenants();
    };
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
      { name: 'monthly_bills', setter: setMonthlyBills },
      { name: 'subscription_packages', setter: setSubscriptionPackages }
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
      // If we have a selected tenant (or if non-admin), always filter by tenantId to prevent massive data fetch
      if (effectiveTenantId && !['subscription_packages', 'tenants', 'users'].includes(name)) {
        q = query(collection(db, name), where('tenantId', '==', String(effectiveTenantId)));
      } else if (isSuperAdmin || name === 'users') {
        // Super Admin fetches latest data with a strict limit
        // Users fetch all users to allow filtering by tenant in the computed 'users' property
        q = query(collection(db, name), limit(1000));
      } else {
        // Fallback or empty query to avoid fetching world data
        q = query(collection(db, name), limit(1));
      }

      if (name === 'orders') {
        q = query(
          collection(db, name), 
          ...(effectiveTenantId ? [where('tenantId', '==', String(effectiveTenantId))] : []),
          orderBy('createdAt', 'desc'),
          limit(500)
        );
      }

      if (name === 'subscription_packages') {
        q = query(collection(db, name), limit(100));
      }

      if (['transactions', 'expenses', 'monthly_bills'].includes(name)) {
        const sortField = name === 'monthly_bills' ? 'createdAt' : 'date';
        q = query(
          collection(db, name), 
          ...(effectiveTenantId ? [where('tenantId', '==', String(effectiveTenantId))] : []),
          orderBy(sortField, 'desc'),
          limit(1000)
        );
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

  const categories = useMemo(() => {
    if (business.menuCategories && business.menuCategories.length > 0) {
      return ['All', ...business.menuCategories];
    }
    return ['All', ...Array.from(new Set(menu.map(m => m.category)))];
  }, [menu, business.menuCategories]);

  const users = useMemo(() => {
    let baseUsers = [];
    if (currentUser?.role === Role.SUPER_ADMIN) {
      baseUsers = allUsers;
    } else {
      const targetId = business.id;
      baseUsers = allUsers.filter(u => 
        String(u.tenantId || '01') === String(targetId) || 
        (u.tenantIds && u.tenantIds.includes(String(targetId))) || 
        u.role === Role.SUPER_ADMIN
      );
    }
    
    // Deduplicate by ID to prevent duplicate key errors in UI components
    const seen = new Set();
    return baseUsers.filter(u => {
      const id = u.id || u.uid;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
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
        // Special case for Super Admin: Auto-create profile if email matches
        let userEmail = user.email?.toLowerCase().trim();
        
        // If email is missing from the top-level user object, check providerData
        if (!userEmail && user.providerData.length > 0) {
          userEmail = user.providerData.find(p => p.email)?.email?.toLowerCase().trim();
        }

        const saEmail = 'asitzonebd@gmail.com';
        
        if (userEmail === saEmail) {
          console.log('Super Admin detected via Google Login. Creating profile...');
          const saUser = MOCK_USERS.find(u => u.email.toLowerCase() === saEmail) || {
            id: user.uid,
            name: user.displayName || 'Super Admin',
            email: saEmail,
            password: 'admin123',
            mobile: '0000000',
            role: Role.SUPER_ADMIN,
            avatar: user.photoURL || '',
            permissions: ['Portal']
          };
          
          const newUser = { 
            ...saUser, 
            id: user.uid, 
            email: userEmail || saEmail, 
            name: user.displayName || saUser.name,
            avatar: user.photoURL || saUser.avatar
          };
          
          try {
            await setDoc(doc(db, 'users', newUser.id), newUser);
            setCurrentUser(newUser);
            localStorage.setItem('resto_keep_user', JSON.stringify(newUser));
            localStorage.setItem('sa_bootstrapped', 'true');
            toast.success(`Welcome, Super Admin ${newUser.name}!`);
            return true;
          } catch (setDocError: any) {
            console.error('Error creating Super Admin doc:', setDocError);
            toast.error('Failed to create Super Admin profile: ' + setDocError.message);
            await signOut(auth);
            return false;
          }
        }

        // If it's a new user via Google, we might want to create a profile or deny access
        toast.error(`No account found for ${userEmail || 'unknown email'}. Please register first.`);
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
    console.log('[AppContext] Login attempt for:', emailOrMobile, 'Tenant:', tenantId);
    try {
      let emailToUse = emailOrMobile.trim().toLowerCase();
      
      // If it's a mobile number, lookup the email first
      if (!emailOrMobile.includes('@')) {
        // Since we can't query users without auth, we assume it's a customer mobile login
        // or a staff member who was created with a mobile-based email.
        emailToUse = `${emailOrMobile.trim()}@customer.com`;
        console.log('[AppContext] Mobile detected, using email:', emailToUse);
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      console.log('[AppContext] Auth successful for UID:', userCredential.user.uid);
      
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        console.error('[AppContext] User profile missing in Firestore for UID:', userCredential.user.uid);
        await signOut(auth);
        setIsLoading(false);
        toast.error('User profile not found. Please contact support.');
        return false;
      }

      const user = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
      console.log('[AppContext] Profile loaded:', user.name, 'Role:', user.role);
      
      if (user) {
        // If a specific tenantId is provided in the URL, verify the user belongs to it
        if (tenantId && user.tenantId && String(user.tenantId) !== String(tenantId) && user.role !== Role.SUPER_ADMIN) {
          console.warn('[AppContext] Access denied: tenant mismatch', { userTenant: user.tenantId, targetTenant: tenantId });
          await signOut(auth);
          setIsLoading(false);
          toast.error('Access denied for this restaurant.');
          return false;
        }
        
        if (!tenantId && user.role !== Role.SUPER_ADMIN && !user.tenantId) {
          console.warn('[AppContext] Access denied: no tenant for non-superadmin');
          await signOut(auth);
          setIsLoading(false);
          toast.error('Invalid account configuration.');
          return false;
        }

        // Set tenant context if provided or if user has one
        if (tenantId) {
          setCurrentTenantId(tenantId);
        } else if (user.tenantId && user.role !== Role.SUPER_ADMIN) {
          setCurrentTenantId(user.tenantId);
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
      console.error('[AppContext] Login error:', error.code, error.message);
      setIsLoading(false);
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed login attempts. Please wait a few minutes and try again.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email/mobile or password. Please try again.');
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
    
    console.log('[AppContext] addOrder called. resolvedTenantId:', resolvedTenantId, 'Final tenantId:', tenantId);
    console.log('[AppContext] Business context:', { id: business.id, name: business.name, enablePrintAgent: business.printerSettings?.enablePrintAgent });

    try {
      const batch = writeBatch(db);
      
      // Handle auto-mark status before saving
      const finalItems = business.printerSettings?.autoMarkReadyOnPrint 
        ? newOrder.items.map(item => ({ ...item, status: OrderStatus.READY as ItemStatus }))
        : newOrder.items;
      const finalStatus = business.printerSettings?.autoMarkReadyOnPrint ? OrderStatus.READY : newOrder.status;

      // Add order
      const orderRef = doc(db, 'orders', newOrder.id);
      batch.set(orderRef, cleanObject({
        ...newOrder,
        items: finalItems,
        status: finalStatus,
        createdAt: serverTimestamp()
      }));

    // Update menu item stock and validate
    const inventoryUpdates: { [id: string]: number } = {};
    const menuUpdates: { [id: string]: number } = {};
    const isRecipeMode = business.inventoryMode === InventoryMode.RECIPE;

    for (const item of newOrder.items) {
      const menuItem = allMenu.find(m => m.id === item.itemId);
      if (menuItem) {
        // In Simple Mode, we check menu item stock
        if (!isRecipeMode && menuItem.stock !== undefined && menuItem.stock !== null) {
          const currentMenuStock = menuUpdates[item.itemId] !== undefined ? menuUpdates[item.itemId] : menuItem.stock;
          if (currentMenuStock < item.quantity) {
            throw new Error(`Insufficient stock for ${menuItem.name}`);
          }
          menuUpdates[item.itemId] = Math.max(0, currentMenuStock - item.quantity);
        }

        // Handle Inventory Deductions
        if (isRecipeMode) {
          const recipe = recipes.find(r => r.menuItemId === item.itemId);
          if (recipe) {
            for (const ingredient of recipe.ingredients) {
              const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
              if (invItem) {
                const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
                const deduction = ingredient.quantity * item.quantity;
                if (currentInvQty < deduction) {
                   throw new Error(`Insufficient ${invItem.name} for ${menuItem.name}`);
                }
                inventoryUpdates[invItem.id] = Math.max(0, currentInvQty - deduction);
              }
            }
          }
        } else {
          // Simple Mode Inventory Sync
          const linkedInvItem = allInventory.find(inv => 
            inv.menuItemIds?.includes(item.itemId) || 
            (inv.menuCategory === menuItem.category && (!inv.menuItemIds || inv.menuItemIds.length === 0))
          );
          if (linkedInvItem) {
            const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
            
            // Get consumption quantity
            let consumption = 1;
            if (linkedInvItem.menuItemLinks) {
              const link = linkedInvItem.menuItemLinks.find(l => l.itemId === item.itemId);
              if (link) consumption = link.consumption;
            }
            
            const deduction = consumption * item.quantity;
            const newInvQty = Math.max(0, currentInvQty - deduction);
            inventoryUpdates[linkedInvItem.id] = newInvQty;

            if (linkedInvItem.menuCategory && (!linkedInvItem.menuItemIds || linkedInvItem.menuItemIds.length === 0)) {
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
      
      // Centralized Print Trigger
      if (business.printerSettings?.enablePrintAgent) {
        console.log('[AppContext] Print agent enabled for business:', business.id, '. Creating print request...');
        createPrintRequest(newOrder).catch(err => console.error('[AppContext] Auto-print failed:', err));
      } else {
        console.log('[AppContext] Print agent NOT enabled for business:', business.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      throw error; // Re-throw to handle in UI
    }
  };

  const createPrintRequest = async (order: Order, type: 'kot' | 'invoice' = 'kot') => {
    try {
      console.log('[AppContext] Creating print request for tenant:', order.tenantId, 'Order:', order.id, 'Type:', type);
      const docRef = await addDoc(collection(db, 'print_requests'), {
        tenantId: order.tenantId,
        businessName: business.name || 'Restaurant',
        businessAddress: business.address || null,
        businessPhone: business.phone || null,
        currency: business.currency || '৳',
        vatRate: business.vatRate || 0,
        includeVat: business.includeVat || false,
        receiptHeader: business.printerSettings?.receiptHeader || null,
        receiptFooter: business.printerSettings?.receiptFooter || null,
        paperWidth: business.printerSettings?.paperWidth || '80mm',
        type,
        orderId: order.id,
        tokenNumber: order.tokenNumber,
        tableNumber: order.tableNumber || null,
        creatorName: order.creatorName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Staff',
        note: order.note || null,
        items: order.items,
        totalAmount: order.totalAmount,
        discount: order.discount || 0,
        autoMarkReady: (type === 'kot' && business.printerSettings?.autoMarkReadyOnPrint) || false,
        deliveryStaffName: order.deliveryStaffName || null,
        createdAt: serverTimestamp()
      });
      console.log('[AppContext] Print request created with ID:', docRef.id);
    } catch (error) {
      console.error('[AppContext] Failed to create print request:', error);
      handleFirestoreError(error, OperationType.CREATE, 'print_requests');
      throw error;
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
    deliveryAddress?: string | null,
    isPaid?: boolean
  ) => {
    const oldOrder = allOrders.find(o => o.id === orderId);
    if (!oldOrder) return;

    const newStatus = business.printerSettings?.autoMarkReadyOnPrint ? OrderStatus.READY : (status ?? oldOrder.status);

    // Apply auto-mark status to items if enabled
    const finalItems = business.printerSettings?.autoMarkReadyOnPrint
      ? items.map(item => ({ ...item, status: OrderStatus.READY as ItemStatus }))
      : items;

    // Calculate stock changes
    const stockChanges: { [itemId: string]: number } = {};
    
    // Sum existing quantities
    const oldTotals: { [itemId: string]: number } = {};
    oldOrder.items.forEach(item => {
      if (item.status !== OrderStatus.CANCELLED) {
        oldTotals[item.itemId] = (oldTotals[item.itemId] || 0) + item.quantity;
      }
    });

    // Sum new quantities
    const newTotals: { [itemId: string]: number } = {};
    finalItems.forEach(item => {
      if (item.status !== OrderStatus.CANCELLED) {
        newTotals[item.itemId] = (newTotals[item.itemId] || 0) + item.quantity;
      }
    });

    // Find all unique Item IDs
    const allItemIds = new Set([...Object.keys(oldTotals), ...Object.keys(newTotals)]);
    
    allItemIds.forEach(itemId => {
      const diff = (newTotals[itemId] || 0) - (oldTotals[itemId] || 0);
      if (diff !== 0) stockChanges[itemId] = diff;
    });

    try {
      const batch = writeBatch(db);
      
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, cleanObject({
        items: finalItems,
        totalAmount,
        status: newStatus,
        creatorName: oldOrder.creatorName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Staff',
        note: note ?? oldOrder.note ?? null,
        deliveryStaffId: deliveryStaffId !== undefined ? deliveryStaffId : (oldOrder.deliveryStaffId ?? null),
        deliveryStaffName: deliveryStaffName !== undefined ? deliveryStaffName : (oldOrder.deliveryStaffName ?? null),
        deliveryStaffMobile: deliveryStaffMobile !== undefined ? deliveryStaffMobile : (oldOrder.deliveryStaffMobile ?? null),
        deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : (oldOrder.deliveryAddress ?? null),
        isPaid: isPaid !== undefined ? isPaid : (oldOrder.isPaid ?? false)
      }));

      // Update stock in Firestore and validate
      const inventoryUpdates: { [id: string]: number } = {};
      const menuUpdates: { [id: string]: number } = {};
      const isRecipeMode = business.inventoryMode === InventoryMode.RECIPE;

      for (const itemId in stockChanges) {
        const change = stockChanges[itemId];
        const menuItem = allMenu.find(m => m.id === itemId);
        if (menuItem) {
          // In Simple Mode, we check menu item stock
          if (!isRecipeMode && menuItem.stock !== undefined && menuItem.stock !== null) {
            const currentMenuStock = menuUpdates[itemId] !== undefined ? menuUpdates[itemId] : menuItem.stock;
            if (change > 0 && currentMenuStock < change) {
              throw new Error(`Insufficient stock for ${menuItem.name}`);
            }
            menuUpdates[itemId] = Math.max(0, currentMenuStock - change);
          }

          // Handle Inventory Deductions
          if (isRecipeMode) {
            const recipe = recipes.find(r => r.menuItemId === itemId);
            if (recipe) {
              for (const ingredient of recipe.ingredients) {
                const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
                if (invItem) {
                  const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
                  const deduction = ingredient.quantity * change;
                  if (change > 0 && currentInvQty < deduction) {
                    throw new Error(`Insufficient ${invItem.name} for ${menuItem.name}`);
                  }
                  inventoryUpdates[invItem.id] = Math.max(0, currentInvQty - deduction);
                }
              }
            }
          } else {
            // Simple Mode Inventory Sync
            const linkedInvItem = allInventory.find(inv => 
              inv.menuItemId === itemId || 
              (inv.menuCategory === menuItem.category && !inv.menuItemId)
            );
            if (linkedInvItem) {
              const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
              
              // Get consumption quantity
              let consumption = 1;
              if (linkedInvItem.menuItemLinks) {
                const link = linkedInvItem.menuItemLinks.find(l => l.itemId === itemId);
                if (link) consumption = link.consumption;
              }
              
              const deduction = consumption * change;
              const newInvQty = Math.max(0, currentInvQty - deduction);
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

      // Centralized Print Trigger for Updated Orders (New Items Only)
      if (business.printerSettings?.enablePrintAgent) {
        const newItems = items.filter(newItem => {
          const oldItem = oldOrder.items.find(oi => oi.rowId === newItem.rowId);
          return !oldItem;
        });

        if (newItems.length > 0) {
          const printOrder = {
            ...oldOrder,
            note: note, // Pass the newly updated note
            items: newItems,
            totalAmount: newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
          } as Order;
          createPrintRequest(printOrder).catch(err => console.error('[AppContext] Auto-print update failed:', err));
        }
      }
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
      
      // If kitchen staff has assigned categories, only update those items
      let updatedItems = [...order.items];
      const isKitchen = currentUser?.role === Role.KITCHEN;
      const hasAssignedCats = currentUser?.assignedCategories && currentUser.assignedCategories.length > 0;

      if (isKitchen && hasAssignedCats) {
        updatedItems = order.items.map(item => {
          const menuItem = allMenu.find(m => m.id === item.itemId);
          if (menuItem && currentUser.assignedCategories?.includes(menuItem.category)) {
            return { ...item, status: status as unknown as ItemStatus };
          }
          return item;
        });
      } else {
        // Otherwise update all items
        updatedItems = order.items.map(i => ({ ...i, status: status as unknown as ItemStatus }));
      }

      // Determine the overall order status
      // If some items are still PENDING, the order should probably stay PREPARING or PENDING
      // But for simplicity, we'll keep the requested status if it's an admin or if all items match the new status
      let finalOrderStatus = status;
      if (isKitchen && hasAssignedCats) {
        const allReady = updatedItems.every(i => i.status === OrderStatus.READY || i.status === OrderStatus.CANCELLED);
        const allPreparing = updatedItems.every(i => i.status === OrderStatus.PREPARING || i.status === OrderStatus.READY || i.status === OrderStatus.CANCELLED);
        
        if (status === OrderStatus.READY && !allReady) {
          finalOrderStatus = OrderStatus.PREPARING;
        } else if (status === OrderStatus.PREPARING && !allPreparing) {
          finalOrderStatus = OrderStatus.PENDING;
        }
      }

      const updates: any = {
        status: finalOrderStatus,
        items: updatedItems
      };
      if (discount !== undefined) updates.discount = discount;

      batch.update(orderRef, updates);

      // If order is cancelled, return items to stock
      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        const inventoryUpdates: { [id: string]: number } = {};
        const menuUpdates: { [id: string]: number } = {};
        const isRecipeMode = business.inventoryMode === InventoryMode.RECIPE;

        for (const item of order.items) {
          if (item.status === OrderStatus.CANCELLED) continue; // Already returned stock

          const menuItem = allMenu.find(m => m.id === item.itemId);
          if (menuItem) {
            // Return Menu Stock in Simple Mode
            if (!isRecipeMode && menuItem.stock !== undefined) {
              const currentMenuStock = menuUpdates[item.itemId] !== undefined ? menuUpdates[item.itemId] : menuItem.stock;
              menuUpdates[item.itemId] = currentMenuStock + item.quantity;
            }

            // Return Inventory Stock
            if (isRecipeMode) {
              const recipe = recipes.find(r => r.menuItemId === item.itemId);
              if (recipe) {
                for (const ingredient of recipe.ingredients) {
                  const invItem = allInventory.find(i => i.id === ingredient.inventoryItemId);
                  if (invItem) {
                    const currentInvQty = inventoryUpdates[invItem.id] !== undefined ? inventoryUpdates[invItem.id] : invItem.quantity;
                    inventoryUpdates[invItem.id] = currentInvQty + (ingredient.quantity * item.quantity);
                  }
                }
              }
            } else {
              // Simple Mode Inventory Sync
              const linkedInvItem = allInventory.find(inv => 
                inv.menuItemIds?.includes(item.itemId) || 
                (inv.menuCategory === menuItem.category && (!inv.menuItemIds || inv.menuItemIds.length === 0))
              );
              if (linkedInvItem) {
                const currentInvQty = inventoryUpdates[linkedInvItem.id] !== undefined ? inventoryUpdates[linkedInvItem.id] : linkedInvItem.quantity;
                
                // Get consumption quantity
                let consumption = 1;
                if (linkedInvItem.menuItemLinks) {
                  const link = linkedInvItem.menuItemLinks.find(l => l.itemId === item.itemId);
                  if (link) consumption = link.consumption;
                }
                
                const returnQty = consumption * item.quantity;
                const newInvQty = currentInvQty + returnQty;
                inventoryUpdates[linkedInvItem.id] = newInvQty;

                if (linkedInvItem.menuCategory && (!linkedInvItem.menuItemIds || linkedInvItem.menuItemIds.length === 0)) {
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
    let newItems: OrderItem[] = [];
    if (status === OrderStatus.CANCELLED) {
      newItems = order.items.filter(i => !rowIds.includes(i.rowId));
    } else {
      newItems = order.items.map(i => rowIds.includes(i.rowId) ? { ...i, status } : i);
    }
    
    // Recalculate total amount
    const newTotalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let newOrderStatus = order.status;
    const allReady = newItems.length > 0 && newItems.every(i => i.status === OrderStatus.READY);
    const anyPreparing = newItems.some(i => i.status === OrderStatus.PREPARING);
    const allCancelled = newItems.length === 0;

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
        const isCancelling = status === OrderStatus.CANCELLED && itemToUpdate.status !== OrderStatus.CANCELLED;
        const isUncancelling = status !== OrderStatus.CANCELLED && itemToUpdate.status === OrderStatus.CANCELLED;

        if (itemToUpdate && (isCancelling || isUncancelling)) {
          const multiplier = isCancelling ? 1 : -1;
          const menuItem = allMenu.find(m => m.id === itemToUpdate.itemId);
          if (menuItem && menuItem.stock !== undefined) {
            const newStock = menuItem.stock + (itemToUpdate.quantity * multiplier);
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
                    quantity: invItem.quantity + (ingredient.quantity * itemToUpdate.quantity * multiplier),
                    lastUpdated: serverTimestamp()
                  });
                }
              }
            } else {
              const linkedInvItem = allInventory.find(inv => 
                inv.menuItemIds?.includes(itemToUpdate.itemId) || 
                (inv.menuCategory === menuItem.category && (!inv.menuItemIds || inv.menuItemIds.length === 0))
              );
              if (linkedInvItem) {
                // Get consumption quantity
                let consumption = 1;
                if (linkedInvItem.menuItemLinks) {
                  const link = linkedInvItem.menuItemLinks.find(l => l.itemId === itemToUpdate.itemId);
                  if (link) consumption = link.consumption;
                }
                
                const totalChange = consumption * itemToUpdate.quantity * multiplier;
                const newInvQty = linkedInvItem.quantity + totalChange;
                const invRef = doc(db, 'inventory_items', linkedInvItem.id);
                batch.update(invRef, { 
                  quantity: newInvQty,
                  lastUpdated: serverTimestamp()
                });

                if (linkedInvItem.menuCategory && (!linkedInvItem.menuItemIds || linkedInvItem.menuItemIds.length === 0)) {
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

  const updateOrderPaymentStatus = async (orderId: string, isPaid: boolean) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { isPaid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
    }
  };

  const updateInventory = async (itemId: string, quantityChange: number, historyDetails?: { supplier?: string, totalAmount?: number, paidAmount?: number, dueAmount?: number }) => {
    try {
      const item = allInventory.find(i => i.id === itemId);
      if (item) {
        const batch = writeBatch(db);
        const itemRef = doc(db, 'inventory_items', itemId);
        const newQuantity = Math.max(0, item.quantity + quantityChange);
        
        const totalAmount = (item.totalAmount || 0) + (historyDetails?.totalAmount || 0);
        const paidAmount = (item.paidAmount || 0) + (historyDetails?.paidAmount || 0);
        const dueAmount = (item.dueAmount || 0) + (historyDetails?.dueAmount || 0);

        batch.update(itemRef, cleanObject({
          quantity: newQuantity,
          totalAmount,
          paidAmount,
          dueAmount,
          lastUpdated: serverTimestamp(),
          history: [...(item.history || []), { 
            date: new Date().toISOString(), 
            action: 'Update Stock', 
            change: quantityChange, 
            newStock: newQuantity,
            ...historyDetails
          }]
        }));

        // Sync with menu item if linked (Direct link or Category link)
        if (item.menuItemIds && item.menuItemIds.length > 0) {
          item.menuItemIds.forEach(id => {
            const menuRef = doc(db, 'menu_items', id);
            batch.update(menuRef, { stock: newQuantity });
          });
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
      
      const itemData = cleanObject({
        ...newItem,
        totalAmount: isNaN(newItem.totalAmount!) ? 0 : newItem.totalAmount,
        paidAmount: isNaN(newItem.paidAmount!) ? 0 : newItem.paidAmount,
        dueAmount: isNaN(newItem.dueAmount!) ? 0 : newItem.dueAmount,
        lastUpdated: serverTimestamp()
      });
      console.log('Adding inventory item to batch:', newItem.name, 'with history:', itemData.history, 'full itemData:', itemData);
      batch.set(itemRef, itemData);

      // If linked to a menu item or category, sync initial quantity
      if (newItem.menuItemIds && newItem.menuItemIds.length > 0) {
        newItem.menuItemIds.forEach(id => {
          const menuRef = doc(db, 'menu_items', id);
          batch.update(menuRef, { stock: newItem.quantity });
        });
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
        const menuItemIds = updates.menuItemIds !== undefined ? updates.menuItemIds : item?.menuItemIds;
        const menuCategory = updates.menuCategory !== undefined ? updates.menuCategory : item?.menuCategory;
        
        if (menuItemIds && menuItemIds.length > 0) {
          menuItemIds.forEach(mId => {
            const menuRef = doc(db, 'menu_items', mId);
            batch.update(menuRef, { stock: updates.quantity });
          });
        } else if (menuCategory) {
          const categoryItems = allMenu.filter(m => m.category === menuCategory);
          categoryItems.forEach(m => {
            const menuRef = doc(db, 'menu_items', m.id);
            batch.update(menuRef, { stock: updates.quantity });
          });
        }
      } else if (updates.menuItemIds !== undefined || updates.menuCategory !== undefined) {
        // If only link is updated, sync current quantity to menu item(s)
        const item = allInventory.find(i => i.id === id);
        if (item) {
          const menuItemIds = updates.menuItemIds !== undefined ? updates.menuItemIds : item.menuItemIds;
          const menuCategory = updates.menuCategory !== undefined ? updates.menuCategory : item.menuCategory;
          
          if (menuItemIds && menuItemIds.length > 0) {
            menuItemIds.forEach(mId => {
              const menuRef = doc(db, 'menu_items', mId);
              batch.update(menuRef, { stock: item.quantity });
            });
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

  const addSubscriptionPackage = async (pkg: Omit<SubscriptionPackage, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'subscription_packages'), {
        ...pkg,
        createdAt: new Date().toISOString()
      });
      toast.success('Subscription package created successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subscription_packages');
    }
  };

  const updateSubscriptionPackage = async (id: string, pkg: Partial<SubscriptionPackage>) => {
    try {
      const docRef = doc(db, 'subscription_packages', id);
      await updateDoc(docRef, cleanObject(pkg));
      toast.success('Subscription package updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subscription_packages/${id}`);
    }
  };

  const deleteSubscriptionPackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscription_packages', id));
      toast.success('Subscription package deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subscription_packages/${id}`);
    }
  };

  const subscribeBusinessToPackage = async (tenantId: string, packageId: string) => {
    try {
      const pkg = subscriptionPackages.find(p => p.id === packageId);
      if (!pkg) throw new Error('Package not found');

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + pkg.durationMonths);

      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, {
        subscription: {
          packageId,
          packageName: pkg.name,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          allowedPages: pkg.allowedPages,
          status: 'active'
        }
      });
      toast.success(`Successfully subscribed to ${pkg.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'tenantId'>) => {
    const tenantId = resolvedTenantId || '';
    const newItem = { ...item, tenantId } as MenuItem;
    
    try {
      const batch = writeBatch(db);
      const itemRef = doc(db, 'menu_items', newItem.id);

      // Check if there's a category-linked inventory item
      const linkedInvItem = allInventory.find(inv => inv.menuCategory === newItem.category && (!inv.menuItemIds || inv.menuItemIds.length === 0));
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
        const linkedInvItem = allInventory.find(inv => inv.menuCategory === updates.category && (!inv.menuItemIds || inv.menuItemIds.length === 0));
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
  
  const updateMenuCategories = async (newCategories: string[]) => {
    const tenantId = resolvedTenantId || '';
    if (!tenantId) return;

    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, { menuCategories: newCategories });
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
      setAllRecipes(prev => {
        if (prev.some(r => r.id === newRecipe.id)) return prev;
        return [...prev, newRecipe];
      });
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
      // 1. Check for duplicate mobile number across entire system
      // We check Firestore directly to ensure we catch duplicates across all tenants even if not loaded in local state
      const mobileQuery = query(collection(db, 'users'), where('mobile', '==', user.mobile), limit(1));
      const mobileSnapshot = await getDocs(mobileQuery);
      if (!mobileSnapshot.empty) {
        toast.error('Mobile number is already registered by another user.');
        throw new Error('Mobile number already exists');
      }

      // 2. Check for duplicate email across entire system
      const emailQuery = query(collection(db, 'users'), where('email', '==', user.email.toLowerCase()), limit(1));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        toast.error('Email is already registered. Please use a different one.');
        throw new Error('Email already exists');
      }

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
      setAllUsers(prev => {
        if (prev.some(u => u.id === newUser.id)) return prev;
        return [...prev, newUser];
      });
      
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
      // If mobile or email is being updated, check for uniqueness across the system
      if (updates.mobile) {
        const mobileQuery = query(collection(db, 'users'), where('mobile', '==', updates.mobile), limit(1));
        const mobileSnapshot = await getDocs(mobileQuery);
        if (!mobileSnapshot.empty && mobileSnapshot.docs[0].id !== userId) {
          toast.error('This mobile number is already used by another user.');
          return;
        }
      }

      if (updates.email) {
        const emailQuery = query(collection(db, 'users'), where('email', '==', updates.email.toLowerCase()), limit(1));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty && emailSnapshot.docs[0].id !== userId) {
          toast.error('This email is already used by another user.');
          return;
        }
      }

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
    const tenantId = resolvedTenantId;
    if (!tenantId) {
      console.error('[AppContext] Cannot update business: No tenantId resolved!');
      return; 
    }
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, updates);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  };

  const updateTenant = async (tenantId: string, updates: Partial<Business>) => {
    if (!tenantId) {
      console.error('[AppContext] Cannot update tenant: No tenantId provided!');
      return; 
    }
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
      inventoryMode: businessData.inventoryMode || InventoryMode.SIMPLE,
      createdAt: new Date().toISOString()
    };

    let ownerUid = `u-${Date.now()}`;
    let existingOwner: User | null = null;
    
    const existingUser = allUsers.find(u => u.email.toLowerCase() === ownerData.email?.toLowerCase());
    const existingUserByMobile = allUsers.find(u => u.mobile === ownerData.mobile);

    if (existingUserByMobile && (!existingUser || existingUser.id !== existingUserByMobile.id)) {
      toast.error('This mobile number is already registered for another account.');
      return '';
    }

    if (existingUser) {
      if (existingUser.role !== Role.OWNER && existingUser.role !== Role.SUPER_ADMIN) {
        toast.error('This email is already registered for a non-owner account.');
        return '';
      }
      existingOwner = existingUser;
      ownerUid = existingUser.id;
    } else {
      try {
        // Create owner in Firebase Auth using secondary app to avoid signing out current user
        if (ownerData.email && ownerData.password) {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, ownerData.email, ownerData.password);
          ownerUid = userCredential.user.uid;
          await signOut(secondaryAuth);
        }
      } catch (authError: any) {
        console.error('Error creating owner auth:', authError);
        if (authError.code === 'auth/email-already-in-use') {
          toast.error('The email address is already in use by another account. Please use a different email.');
          return '';
        }
        toast.error('Failed to create owner account: ' + authError.message);
        return '';
      }
    }

    let ownerToSave: User;
    if (existingOwner) {
      const updatedTenantIds = existingOwner.tenantIds ? [...existingOwner.tenantIds, newTenantId] : [existingOwner.tenantId || '', newTenantId].filter(Boolean);
      ownerToSave = { 
        ...existingOwner, 
        tenantIds: Array.from(new Set(updatedTenantIds)) 
      };
    } else {
      ownerToSave = {
        id: ownerUid,
        tenantId: newTenantId,
        tenantIds: [newTenantId],
        name: ownerData.name || 'Owner',
        email: ownerData.email || '',
        password: ownerData.password || '',
        mobile: ownerData.mobile || '',
        role: Role.OWNER,
        avatar: '',
        permissions: ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings']
      };
    }

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'tenants', newBusiness.id), newBusiness);
      batch.set(doc(db, 'users', ownerToSave.id), ownerToSave);

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

        const sourceRecipes = allRecipes.filter(r => r.tenantId === sourceTenantId);
        sourceRecipes.forEach((recipe, index) => {
          const newRecipeId = `r-${Date.now()}-${index}`;
          const newRecipe = {
            ...recipe,
            id: newRecipeId,
            tenantId: newTenantId
          };
          batch.set(doc(db, 'recipes', newRecipeId), newRecipe);
        });
      }

      await batch.commit();

      // Optimistic update for local state
      setTenants(prev => {
        if (prev.some(t => t.id === newBusiness.id)) return prev;
        return [...prev, newBusiness];
      });
      setAllUsers(prev => {
        if (prev.some(u => u.id === ownerToSave.id)) return prev;
        return [...prev, ownerToSave];
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
    
    console.log('[AppContext] Adding transaction:', newTransaction);
    try {
      const transRef = doc(db, 'transactions', newTransaction.id);
      await setDoc(transRef, cleanObject(newTransaction));
      setAllTransactions(prev => {
        if (prev.some(t => t.id === newTransaction.id)) return prev;
        return [newTransaction, ...prev];
      });
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
      setAllExpenses(prev => {
        if (prev.some(e => e.id === newExpense.id)) return prev;
        return [newExpense, ...prev];
      });
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

  const markBillAsPaid = async (billId: string, txnId: string) => {
    const paidAt = new Date().toISOString();
    try {
      const billRef = doc(db, 'monthly_bills', billId);
      await updateDoc(billRef, {
        status: BillStatus.PAID,
        paidAt,
        txnId
      });
      setMonthlyBills(prev => prev.map(b => b.id === billId ? { ...b, status: BillStatus.PAID, paidAt, txnId } : b));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `monthly_bills/${billId}`);
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

  const getDefaultRedirect = () => {
    if (!currentUser) return "/";
    
    // Prioritize user's assigned tenant ID for internal redirects to avoid slug/ID mismatch loops
    const targetId = currentUser.tenantId || currentTenantId || business?.id || business?.slug;

    if (!targetId) return currentUser.role === Role.SUPER_ADMIN ? "/portal" : "/";

    // If Super Admin is in a tenant context, go to that tenant's dashboard
    if (currentUser.role === Role.SUPER_ADMIN) {
      if (currentTenantId && currentTenantId !== '00' && currentTenantId !== '01') {
        return `/${targetId}/dashboard`;
      }
      return "/portal";
    }
    
    if (currentUser.role === Role.CUSTOMER) return `/${targetId}/order`;
    
    const permissions = currentUser.permissions || [];
    if (permissions.includes('Dashboard')) return `/${targetId}/dashboard`;
    if (permissions.includes('POS')) return `/${targetId}/pos`;
    if (permissions.length > 0) return `/${targetId}/${permissions[0].toLowerCase()}`;
    
    // Final fallback to avoid redirect loops
    return currentUser.role === Role.SUPER_ADMIN ? "/portal" : "/";
  };

  const getNextToken = useCallback((prefix?: string) => {
    const timezone = business?.timezone || 'UTC';
    const now = new Date();
    // Using en-CA for stable YYYY-MM-DD format
    const todayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const today = todayFormat.format(now);
    
    const allTodayOrders = orders.filter(o => {
        if (!o.createdAt || !o.tokenNumber) return false;
        const orderDate = new Date(o.createdAt);
        const orderDay = todayFormat.format(orderDate);
        
        // Match prefix if provided, otherwise ensure it's a standard POS token (no hyphens usually)
        const matchesPrefix = prefix ? o.tokenNumber.startsWith(prefix) : !o.tokenNumber.includes('-');
        
        // Include ALL orders to prevent duplication even if one is cancelled
        return orderDay === today && matchesPrefix;
    });
    
    const takenTokens = allTodayOrders.map(o => {
        // Extract the numeric part of the token
        const match = o.tokenNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : NaN;
    }).filter(n => !isNaN(n));
    
    // Find the max token number and add 1
    let maxToken = 0;
    takenTokens.forEach(n => {
        if (n > maxToken) maxToken = n;
    });
    const nextToken = maxToken + 1;
    
    const formattedToken = String(nextToken).padStart(2, '0');
    return prefix ? `${prefix}-${formattedToken}` : formattedToken;
  }, [orders, business]);

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
      createPrintRequest,
      updateOrderItems,
      updateOrderStatus,
      updateOrderItemStatus,
      updateOrderPaymentStatus,
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
      updateMenuCategories,
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
      activeTenantId,
      setActiveTenantId,
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
      markBillAsPaid,
      subscriptionPackages,
      addSubscriptionPackage,
      updateSubscriptionPackage,
      deleteSubscriptionPackage,
      subscribeBusinessToPackage,
      allUsers,
      isLoading,
      isAuthReady,
      getDefaultRedirect,
      activeCategory,
      setActiveCategory,
      categories,
      dbStatus,
      tables,
      addTable,
      deleteTable,
      getNextToken,
      relayMode,
      setRelayMode: toggleRelayMode
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
