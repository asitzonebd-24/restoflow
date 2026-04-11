
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { Role, Business, User, Order, InventoryItem, MenuItem, OrderStatus, ItemStatus, Transaction, Expense, OrderItem, MonthlyBill, BillStatus, Recipe, Table, InventoryMode } from '../types';
import { BUSINESS_DETAILS, MOCK_USERS, INITIAL_ORDERS, MOCK_INVENTORY, MOCK_MENU, MOCK_EXPENSES, DEFAULT_MENU_IMAGE, DEFAULT_AVATAR, DEFAULT_BUSINESS_LOGO } from '../constants';
import { auth, secondaryAuth, db, googleProvider } from '../firebase';
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
  documentId,
  getDocFromServer,
  documentId as docId
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
  getDefaultRedirect: () => string;
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
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const loadedCollectionsRef = useRef<Set<string>>(new Set());
  
  const getCriticalCollections = useCallback(() => {
    const isSuperAdmin = currentUser && (
      String(currentUser.role).toUpperCase() === Role.SUPER_ADMIN || 
      currentUser.email?.toLowerCase() === 'asitzonebd@gmail.com'
    );
    const collections = ['users', 'tenants'];
    if (!isSuperAdmin || currentTenantId) {
      collections.push('transactions', 'expenses', 'orders', 'menu_items', 'inventory_items', 'tables');
    }
    return collections;
  }, [currentUser?.role, currentUser?.email, currentTenantId]);

  const checkLoadingState = useCallback((name: string) => {
    loadedCollectionsRef.current.add(name);
    const critical = getCriticalCollections();
    if (critical.every(c => loadedCollectionsRef.current.has(c))) {
      setIsLoading(prev => {
        if (prev) console.log('[AppContext] All critical collections loaded, stopping global loading');
        return false;
      });
    }
  }, [getCriticalCollections]);

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getDefaultRedirect = useCallback(() => {
    if (!currentUser) return "/login";
    
    const isSuperAdmin = currentUser.role === Role.SUPER_ADMIN || currentUser.email?.toLowerCase() === 'asitzonebd@gmail.com';
    
    // If super admin and no tenant selected, go to portal
    if (isSuperAdmin && !currentTenantId) return "/portal";
    
    // Determine the target tenant ID
    const targetId = currentTenantId || currentUser.tenantId || (currentUser.tenantIds && currentUser.tenantIds[0]) || 'default';
    
    if (isSuperAdmin) {
      return `/${targetId}/dashboard`;
    }
    
    if (currentUser.role === Role.CUSTOMER) return `/${targetId}/order`;
    
    // Owners and Managers get dashboard by default
    if (currentUser.role === Role.OWNER || currentUser.role === Role.MANAGER) {
      return `/${targetId}/dashboard`;
    }
    
    const permissions = currentUser.permissions || [];
    if (permissions.includes('Dashboard')) return `/${targetId}/dashboard`;
    if (permissions.includes('POS')) return `/${targetId}/pos`;
    if (permissions.includes('Kitchen')) return `/${targetId}/kitchen`;
    if (permissions.length > 0) return `/${targetId}/${permissions[0].toLowerCase()}`;
    
    // Final fallback to avoid redirect loops
    return isSuperAdmin ? "/portal" : "/";
  }, [currentUser, currentTenantId]);

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
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(`[AppContext] State Update - isLoading: ${isLoading}, isAuthReady: ${isAuthReady}, currentUser: ${currentUser?.email || 'null'}`);
  }, [isLoading, isAuthReady, currentUser]);
  const [activeCategory, setActiveCategory] = useState<string>('Select Categories');
  const [dbStatus, setDbStatus] = useState<{
    isConfigured: boolean;
    hasTables: boolean;
    missingTables: string[];
  }>({
    isConfigured: true,
    hasTables: true,
    missingTables: []
  });

  const profileUnsubRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Real-time listener for current user profile
          const userRef = doc(db, 'users', user.uid);
          
          // Fetch profile once first to ensure isAuthReady is set correctly
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...convertFirestoreData(userDoc.data()) } as User;
            setCurrentUser(userData);
            localStorage.setItem('resto_keep_user', JSON.stringify(userData));
          } else {
            console.warn('[AppContext] User profile not found in Firestore for UID:', user.uid);
            setCurrentUser(null);
            localStorage.removeItem('resto_keep_user');
          }

          if (profileUnsubRef.current) profileUnsubRef.current();
          profileUnsubRef.current = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const userData = { id: doc.id, ...convertFirestoreData(doc.data()) } as User;
              setCurrentUser(userData);
              localStorage.setItem('resto_keep_user', JSON.stringify(userData));
            }
          });
        } else {
          if (profileUnsubRef.current) {
            profileUnsubRef.current();
            profileUnsubRef.current = null;
          }
          setCurrentUser(null);
          localStorage.removeItem('resto_keep_user');
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        setIsAuthReady(true);
      }
    });

    bootstrapSuperAdmin();

    return () => {
      unsubscribe();
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
      }
    };
  }, []);

  // Bootstrap Super Admin into Firestore if it doesn't exist
  const bootstrapSuperAdmin = async () => {
    // Only run once per browser to avoid "too many login attempts" from Firebase Auth
    if (localStorage.getItem('sa_bootstrapped')) return;

    try {
      const saEmail = 'asitzonebd@gmail.com';
      const saPassword = 'admin123'; // Match MOCK_USERS password
      
      console.log('[AppContext] Checking Super Admin bootstrap status...');
      
      // Try to sign in to see if the user exists in Firebase Auth
      try {
        await signInWithEmailAndPassword(secondaryAuth, saEmail, saPassword);
        console.log('[AppContext] Super Admin already exists in Firebase Auth.');
        
        // Ensure profile exists in Firestore
        const userCredential = secondaryAuth.currentUser;
        if (userCredential) {
          const userDoc = await getDoc(doc(db, 'users', userCredential.uid));
          if (!userDoc.exists()) {
            console.log('[AppContext] Super Admin profile missing in Firestore, creating...');
            const saUser = MOCK_USERS.find(u => u.email === saEmail);
            if (saUser) {
              const newUser = { ...saUser, id: userCredential.uid };
              await setDoc(doc(db, 'users', newUser.id), newUser);
            }
          }
        }
        await signOut(secondaryAuth);
        localStorage.setItem('sa_bootstrapped', 'true');
      } catch (e: any) {
        // If user doesn't exist or invalid credentials, try to create them
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.message.includes('invalid-credential')) {
          console.log('[AppContext] Bootstrapping Super Admin into Firebase Auth...');
          try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, saEmail, saPassword);
            
            const saUser = MOCK_USERS.find(u => u.email === saEmail);
            if (saUser) {
              const newUser = { ...saUser, id: userCredential.user.uid };
              await setDoc(doc(db, 'users', newUser.id), newUser);
              console.log('[AppContext] Super Admin bootstrapped successfully.');
            }
            await signOut(secondaryAuth);
            localStorage.setItem('sa_bootstrapped', 'true');
          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              console.log('[AppContext] Super Admin email already in use in Firebase Auth. Skipping creation.');
              localStorage.setItem('sa_bootstrapped', 'true');
            } else if (createError.code === 'auth/too-many-requests') {
              console.warn('[AppContext] Too many login attempts. Skipping bootstrap for now.');
            } else {
              console.error('[AppContext] Failed to create Super Admin:', createError);
            }
          }
        } else if (e.code === 'auth/too-many-requests') {
          console.warn('[AppContext] Too many login attempts. Skipping bootstrap for now.');
        } else {
          console.error('[AppContext] Unexpected error during bootstrap:', e);
        }
      }
    } catch (error) {
      console.error('[AppContext] Error bootstrapping Super Admin:', error);
    }
  };
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
    // Prioritize activeTenantId (set via switcher) or currentTenantId (set via URL params)
    let rawId = activeTenantId || currentTenantId;
    
    // If no ID from URL/switcher, we don't automatically fall back to stored IDs for routing
    // to ensure URL remains the single source of truth.
    if (!rawId) return null;
    
    const tenantBySlug = tenants.find(t => 
      t.slug?.toLowerCase() === rawId.toLowerCase() || 
      t.id?.toLowerCase() === rawId.toLowerCase()
    );
    if (tenantBySlug) return tenantBySlug.id;
    return rawId;
  }, [activeTenantId, currentTenantId, tenants]);

  // Sync resolvedTenantId with localStorage and clear state on change
  useEffect(() => {
    const prevTenantId = localStorage.getItem('resto_keep_tenant_id');
    
    if (resolvedTenantId && prevTenantId !== resolvedTenantId) {
      console.log(`[AppContext] Switching tenant from ${prevTenantId} to ${resolvedTenantId}`);
      
      localStorage.setItem('resto_keep_tenant_id', resolvedTenantId);
      
      // Clear previous tenant data to prevent leakage and "previous restaurant" flash
      setAllOrders([]);
      setAllInventory([]);
      setAllMenu([]);
      setAllTransactions([]);
      setAllExpenses([]);
      setAllRecipes([]);
      setAllTables([]);
      setMonthlyBills([]);
      
      // Reset loading state for new tenant
      loadedCollectionsRef.current.clear();
      // Only set isLoading to true if we are not already loading
      setIsLoading(true);
    }
  }, [resolvedTenantId]);

  const tenantIdsString = JSON.stringify(currentUser?.tenantIds);
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

    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN || currentUser?.email?.toLowerCase() === 'asitzonebd@gmail.com';
    const rawTenantId = currentUser?.tenantId || currentTenantId;
    
    // All IDs we definitely want to fetch
    const accessibleTenantIds = Array.from(new Set([
      ...(currentUser?.tenantIds || []),
      currentUser?.tenantId
    ].filter(Boolean) as string[]));

    let tenantsQuery;
    
    if (isSuperAdmin) {
      // Super admins get a lot, but if they are looking for a specific one, we should prioritize it
      if (currentTenantId && currentTenantId !== '00' && currentTenantId !== '01') {
        tenantsQuery = query(
          collection(db, 'tenants'), 
          or(
            where(documentId(), '==', currentTenantId),
            where('slug', '==', currentTenantId)
          ),
          limit(50)
        );
      } else {
        tenantsQuery = query(collection(db, 'tenants'), limit(100));
      }
    } else {
      if (accessibleTenantIds.length > 0) {
        // Fetch the user's tenants. 
        // If currentTenantId is not in their list, we should still try to fetch it 
        // so the app can show "Access Denied" or "Business Not Found" correctly
        const idsToFetch = accessibleTenantIds.slice(0, 30);
        if (currentTenantId && !idsToFetch.includes(currentTenantId)) {
          tenantsQuery = query(
            collection(db, 'tenants'), 
            or(
              where(documentId(), 'in', idsToFetch),
              where(documentId(), '==', currentTenantId),
              where('slug', '==', currentTenantId)
            )
          );
        } else {
          tenantsQuery = query(collection(db, 'tenants'), where(documentId(), 'in', idsToFetch));
        }
      } else if (currentTenantId) {
        // Unauthenticated or no tenants, but we have a URL param
        tenantsQuery = query(collection(db, 'tenants'), or(where(documentId(), '==', currentTenantId), where('slug', '==', currentTenantId)), limit(1));
      } else {
        // Default fallback
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
      
      setTenants(prev => {
        if (JSON.stringify(prev) === JSON.stringify(tenantsData)) return prev;
        return tenantsData;
      });
      
      checkLoadingState('tenants');
      
      if (!currentUser) {
        setIsLoading(prev => prev ? false : prev);
      }
    }, (error) => {
      console.error('Error fetching tenants:', error);
      checkLoadingState('tenants');
      if (!currentUser) setIsLoading(prev => prev ? false : prev);
      setTenants([BUSINESS_DETAILS]);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubTenants();
    };
  }, [isAuthReady, currentUser?.role, currentUser?.tenantId, tenantIdsString, currentTenantId, checkLoadingState]);

  // 2. Data Listeners (Dependent on resolvedTenantId)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const unsubscribers: (() => void)[] = [];
    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN || currentUser?.email === 'asitzonebd@gmail.com';
    const effectiveTenantId = resolvedTenantId;
    const criticalCollections = getCriticalCollections();

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
      if (effectiveTenantId) {
        q = query(collection(db, name), where('tenantId', '==', effectiveTenantId));
      } else {
        q = query(collection(db, name));
      }

      if (name === 'orders') {
        q = query(collection(db, name), ...(effectiveTenantId ? [where('tenantId', '==', effectiveTenantId)] : []), limit(500));
      }

      if (['transactions', 'expenses', 'monthly_bills'].includes(name)) {
        q = query(collection(db, name), ...(effectiveTenantId ? [where('tenantId', '==', effectiveTenantId)] : []), limit(1000));
      }

      const unsub = onSnapshot(q, (snapshot) => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...convertFirestoreData(doc.data()) }));
        
        // Deduplicate data by ID to prevent duplicate key errors in UI
        const uniqueMap = new Map();
        data.forEach((item: any) => {
          if (item.id) uniqueMap.set(item.id, item);
        });
        data = Array.from(uniqueMap.values());

        if (['transactions', 'expenses', 'orders', 'monthly_bills'].includes(name)) {
          const sortField = name === 'orders' || name === 'monthly_bills' ? 'createdAt' : 'date';
          data.sort((a: any, b: any) => (b[sortField] || '').localeCompare(a[sortField] || ''));
        }
        
        setter((prev: any) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });

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
  }, [isAuthReady, currentUser?.id, currentUser?.role, resolvedTenantId, getCriticalCollections, checkLoadingState]);

  // Sync currentUser with allUsers in real-time to reflect role/permission changes
  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
      const updatedUser = allUsers.find(u => u.id === currentUser.id);
      if (updatedUser) {
        // Use JSON.stringify for deep comparison to avoid infinite loops
        const updatedStr = JSON.stringify(updatedUser);
        const currentStr = JSON.stringify(currentUser);

        if (updatedStr !== currentStr) {
          console.log('[AppContext] User data changed in Firestore, syncing local state');
          setCurrentUser(updatedUser);
          localStorage.setItem('resto_keep_user', JSON.stringify(updatedUser));
        }
      }
    }
  }, [allUsers, currentUser?.id]);

  const business = useMemo(() => {
    const targetId = resolvedTenantId;
    if (!targetId) return BUSINESS_DETAILS;
    
    const found = tenants.find(t => 
      String(t.id).toLowerCase() === String(targetId).toLowerCase() || 
      String(t.slug).toLowerCase() === String(targetId).toLowerCase()
    );
    
    if (found) return found;
    
    // If we're at a specific tenant ID but it's not in the list yet, 
    // and we have a default business, only return it if the ID matches
    if (String(BUSINESS_DETAILS.id) === String(targetId) || String(BUSINESS_DETAILS.slug) === String(targetId)) {
      return BUSINESS_DETAILS;
    }
    
    // Final fallback to BUSINESS_DETAILS if no match found
    return BUSINESS_DETAILS;
  }, [tenants, resolvedTenantId]);

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
    const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN || currentUser?.email === 'asitzonebd@gmail.com';
    if (isSuperAdmin) return allUsers;
    const targetId = business.id;
    return allUsers.filter(u => 
      String(u.tenantId || '01') === String(targetId) || 
      (u.tenantIds && u.tenantIds.includes(String(targetId))) || 
      u.role === Role.SUPER_ADMIN ||
      u.email === 'asitzonebd@gmail.com'
    );
  }, [allUsers, currentUser?.role, currentUser?.email, business.id]);

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
        
        // Resolve target tenant ID if it's a slug
        let targetTenantId = null;
        if (resolvedTenantId) {
          targetTenantId = resolvedTenantId;
        }

        const isSuperAdmin = String(userData.role).toUpperCase() === Role.SUPER_ADMIN || userData.email === 'asitzonebd@gmail.com';
        console.log('[AppContext] Google Login - User Role:', userData.role, 'isSuperAdmin:', isSuperAdmin);
        
        if (targetTenantId && !isSuperAdmin) {
          const accessibleTenantIds = Array.from(new Set([
            ...(userData.tenantIds || []),
            userData.tenantId
          ].filter(Boolean))).map(id => String(id).trim().toLowerCase());

          const normalizedTargetId = String(targetTenantId).trim().toLowerCase();
          console.log('[AppContext] Google Login - Checking access:', { normalizedTargetId, accessibleTenantIds });
          let hasAccess = accessibleTenantIds.includes(normalizedTargetId);
          
          if (!hasAccess) {
            // Check if it's a slug
            const accessibleTenantSlugs = tenants
              .filter(t => accessibleTenantIds.includes(String(t.id).trim().toLowerCase()))
              .map(t => t.slug?.trim().toLowerCase())
              .filter(Boolean);
            hasAccess = accessibleTenantSlugs.includes(normalizedTargetId);
          }

          if (!hasAccess) {
            // Check Firestore directly if tenants haven't loaded yet
            try {
              const tenantsRef = collection(db, 'tenants');
              const slugQuery = query(tenantsRef, where('slug', '==', targetTenantId), limit(1));
              const slugSnap = await getDocs(slugQuery);
              if (!slugSnap.empty) {
                const tenantIdFromSlug = slugSnap.docs[0].id.toLowerCase();
                if (accessibleTenantIds.includes(tenantIdFromSlug)) {
                  hasAccess = true;
                }
              }
            } catch (err) {
              console.error('Error checking slug access:', err);
            }
          }
          
          if (!hasAccess) {
            if (String(userData.role).toUpperCase() === Role.OWNER) {
              console.log('[AppContext] Google Login - Owner accessing tenant without explicit assignment, allowing access');
            } else {
              console.warn('[AppContext] Google Login - Access denied: tenant mismatch, falling back to default tenant');
              targetTenantId = null;
            }
          }
        }

        const hasAnyTenant = !!userData.tenantId || (userData.tenantIds && userData.tenantIds.length > 0);
        const canAccessWithoutTenant = isSuperAdmin || String(userData.role).toUpperCase() === Role.OWNER;
        
        if (!canAccessWithoutTenant && !hasAnyTenant) {
          console.warn('[AppContext] Google Login - Access denied: no tenant assigned to user profile', userData);
          await signOut(auth);
          setIsLoading(false);
          toast.error('Invalid account configuration: No restaurant assigned to this account.');
          return false;
        }

        // Set tenant context if resolved
        if (targetTenantId) {
          setCurrentTenantId(targetTenantId);
          setActiveTenantId(targetTenantId);
        } else if (userData.tenantId) {
          setCurrentTenantId(userData.tenantId);
          setActiveTenantId(userData.tenantId);
        } else if (userData.tenantIds && userData.tenantIds.length > 0) {
          setCurrentTenantId(userData.tenantIds[0]);
          setActiveTenantId(userData.tenantIds[0]);
        }

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
        } else {
          console.warn('[AppContext] User profile not found in Firestore for UID:', user.uid);
          toast.error('Access Denied: Your account is not registered. Please contact an administrator.');
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('resto_keep_user');
          return false;
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
      console.log('[AppContext] Profile loaded:', user.name, 'Role:', user.role, 'UserTenant:', user.tenantId, 'UserTenants:', user.tenantIds);
      
      if (user) {
        // Resolve target tenant ID if it's a slug
        let targetTenantId = null;
        if (tenantId) {
          const normalizedTenantId = String(tenantId).trim().toLowerCase();
          const found = tenants.find(t => 
            t.id?.toLowerCase() === normalizedTenantId || 
            t.slug?.toLowerCase() === normalizedTenantId
          );
          
          if (found) {
            targetTenantId = found.id;
            console.log('[AppContext] Resolved targetTenantId from state:', targetTenantId);
          } else {
            // Try fetching from Firestore if not in state
            try {
              console.log('[AppContext] Resolving targetTenantId from Firestore for:', normalizedTenantId);
              const snap = await getDocFromServer(doc(db, 'tenants', normalizedTenantId)); // Try direct ID first
              if (snap.exists()) {
                targetTenantId = snap.id;
                console.log('[AppContext] Resolved targetTenantId from Firestore (direct ID):', targetTenantId);
              } else {
                // Try slug query
                const qSlug = query(collection(db, 'tenants'), where('slug', '==', normalizedTenantId), limit(1));
                const snapSlug = await getDocs(qSlug);
                if (!snapSlug.empty) {
                  targetTenantId = snapSlug.docs[0].id;
                  console.log('[AppContext] Resolved targetTenantId from Firestore (slug query):', targetTenantId);
                } else {
                  targetTenantId = tenantId; // Fallback to raw ID
                  console.log('[AppContext] Fallback targetTenantId to raw ID:', targetTenantId);
                }
              }
            } catch (e) {
              console.error('[AppContext] Error resolving tenant from Firestore:', e);
              targetTenantId = tenantId;
            }
          }
        }

        // If a specific tenantId is provided in the URL, verify the user belongs to it
        const isSuperAdmin = String(user.role).toUpperCase() === Role.SUPER_ADMIN || user.email === 'asitzonebd@gmail.com';
        console.log('[AppContext] Login - User Role:', user.role, 'isSuperAdmin:', isSuperAdmin);

        if (targetTenantId && !isSuperAdmin) {
          const accessibleTenantIds = Array.from(new Set([
            ...(user.tenantIds || []),
            user.tenantId
          ].filter(Boolean))).map(id => String(id).trim().toLowerCase());

          const normalizedTargetId = String(targetTenantId).trim().toLowerCase();
          let hasAccess = accessibleTenantIds.includes(normalizedTargetId);
          
          if (!hasAccess) {
            const accessibleTenantSlugs = tenants
              .filter(t => accessibleTenantIds.includes(String(t.id).trim().toLowerCase()))
              .map(t => t.slug?.trim().toLowerCase())
              .filter(Boolean);
            hasAccess = accessibleTenantSlugs.includes(normalizedTargetId);
          }

          if (!hasAccess) {
            try {
              const tenantsRef = collection(db, 'tenants');
              const slugQuery = query(tenantsRef, where('slug', '==', targetTenantId), limit(1));
              const slugSnap = await getDocs(slugQuery);
              if (!slugSnap.empty) {
                const tenantIdFromSlug = slugSnap.docs[0].id;
                if (accessibleTenantIds.includes(tenantIdFromSlug.toLowerCase())) {
                  hasAccess = true;
                  targetTenantId = tenantIdFromSlug; // Update to actual ID
                }
              }
            } catch (err) {
              console.error('Error checking slug access:', err);
            }
          }
          
          if (!hasAccess) {
            if (String(user.role).toUpperCase() === Role.OWNER) {
              console.log('[AppContext] Login - Owner accessing tenant without explicit assignment, allowing access');
            } else {
              console.warn('[AppContext] Access denied for target tenant, falling back to user default');
              targetTenantId = null;
            }
          }
        }
        
        const hasAnyTenant = !!user.tenantId || (user.tenantIds && user.tenantIds.length > 0);
        const canAccessWithoutTenant = isSuperAdmin || String(user.role).toUpperCase() === Role.OWNER;
        
        if (!canAccessWithoutTenant && !hasAnyTenant) {
          console.warn('[AppContext] Access denied: no tenant assigned to user profile', user);
          await signOut(auth);
          setIsLoading(false);
          toast.error('Invalid account configuration: No restaurant assigned to this account.');
          return false;
        }

        // Set tenant context
        if (targetTenantId) {
          setCurrentTenantId(targetTenantId);
          setActiveTenantId(targetTenantId);
        } else if (user.tenantId) {
          setCurrentTenantId(user.tenantId);
          setActiveTenantId(user.tenantId);
        } else if (user.tenantIds && user.tenantIds.length > 0) {
          setCurrentTenantId(user.tenantIds[0]);
          setActiveTenantId(user.tenantIds[0]);
        } else if (isSuperAdmin || String(user.role).toUpperCase() === Role.OWNER) {
          // Fallback for owners/admins without explicit tenant assignment
          // They will be redirected based on business context in App.tsx
          console.log('[AppContext] User allowed without explicit tenant assignment');
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
        // If it's the Super Admin email, suggest Google Login
        if (emailOrMobile.trim().toLowerCase() === 'asitzonebd@gmail.com') {
          toast.error('Invalid credentials. If you are the Super Admin, try logging in with Google.');
        } else {
          toast.error('Invalid email/mobile or password. Please try again.');
        }
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
      const oldQty = (oldItem && oldItem.status !== OrderStatus.CANCELLED) ? oldItem.quantity : 0;
      const newQty = (newItem.status !== OrderStatus.CANCELLED) ? newItem.quantity : 0;
      const diff = newQty - oldQty;
      if (diff !== 0) stockChanges[newItem.itemId] = (stockChanges[newItem.itemId] || 0) + diff;
    });
    oldOrder.items.forEach(oldItem => {
      const newItem = items.find(ni => ni.itemId === oldItem.itemId);
      if (!newItem && oldItem.status !== OrderStatus.CANCELLED) {
        stockChanges[oldItem.itemId] = (stockChanges[oldItem.itemId] || 0) - oldItem.quantity;
      }
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
                inv.menuItemId === itemToUpdate.itemId || 
                (inv.menuCategory === menuItem.category && !inv.menuItemId)
              );
              if (linkedInvItem) {
                const newInvQty = linkedInvItem.quantity + (itemToUpdate.quantity * multiplier);
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

  const updateOrderPaymentStatus = async (orderId: string, isPaid: boolean) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { isPaid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      throw error;
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
        tenantIds: (user as User).tenantIds || [tenantId].filter(Boolean),
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
    const isSuperAdmin = userToDelete?.role === Role.SUPER_ADMIN || userToDelete?.email === 'asitzonebd@gmail.com';
    if (isSuperAdmin) {
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
      inventoryMode: businessData.inventoryMode || InventoryMode.SIMPLE,
      createdAt: new Date().toISOString()
    };

    let ownerUid = `u-${Date.now()}`;
    let existingOwner: User | null = null;
    
    const existingUser = allUsers.find(u => u.email.toLowerCase() === ownerData.email?.toLowerCase());
    if (existingUser) {
      if (existingUser.role !== Role.OWNER) {
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
      allUsers,
      isLoading,
      activeCategory,
      setActiveCategory,
      categories,
      dbStatus,
      tables,
      addTable,
      deleteTable,
      getDefaultRedirect
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
