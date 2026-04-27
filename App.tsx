
import React, { useState, useMemo } from 'react';
import { auth, db } from './src/firebase';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Kitchen } from './pages/Kitchen';
import { Inventory } from './pages/Inventory';
import { MenuManagement } from './pages/MenuManagement';
import { Billing } from './pages/Billing';
import { Transactions } from './pages/Transactions';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { SalesItems } from './pages/SalesItems';
import { Users as UsersPage } from './pages/Users';
// import { Subscription } from './pages/Subscription';
import { Settings as SettingsPage } from './pages/Settings';
import { CustomerOrder } from './pages/CustomerOrder';
import { CustomerAuth } from './pages/CustomerAuth';
import { CustomerPanel } from './pages/CustomerPanel';
import { CustomerHistory } from './pages/CustomerHistory';
import { SuperAdmin } from './pages/SuperAdmin';
import { TenantLanding } from './pages/TenantLanding';
import { PendingBills } from './pages/PendingBills';
import { ApprovedBills } from './pages/ApprovedBills';
import { PlatformExpenses } from './pages/PlatformExpenses';
import { GlobalReports } from './pages/GlobalReports';
import { Role, OrderStatus } from './types';
import { LayoutDashboard, UtensilsCrossed, ChefHat, Receipt, Package, LogOut, Settings, Users as UsersIcon, History, Wallet, PieChart, Menu as MenuIcon, User as UserCircle, ShieldCheck, PowerOff, FileText, CheckCircle, Menu, X, Utensils, ShoppingBag, Timer, AlertTriangle, Globe, MoreVertical } from 'lucide-react';

import { collection, addDoc } from "firebase/firestore";
import { RestaurantSwitcher } from './components/RestaurantSwitcher';

// Run test on load
// testFirestore();
const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { business, currentUser, logout, orders, categories, setActiveCategory, activeCategory, menu } = useApp();
  const location = useLocation();
  const { tenantId: urlTenantId } = useParams();
  const navigate = useNavigate();

  const activeOrdersCount = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    // Only Owner, Manager, and Super Admin can see all orders
    const isAdmin = currentUser && [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN].includes(currentUser.role);
    const isKitchen = currentUser?.role === Role.KITCHEN;
    const hasAssignedCats = isKitchen && currentUser?.assignedCategories && currentUser.assignedCategories.length > 0;
    
    if (!isAdmin && !isKitchen && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }

    if (hasAssignedCats) {
      // For kitchen staff, only count orders where at least one of THEIR items is not ready
      filtered = filtered.filter(order => {
        const items = order.items || [];
        const myItems = items.filter(item => {
          const menuItem = menu.find(m => m.id === item.itemId);
          return menuItem && currentUser.assignedCategories?.includes(menuItem.category);
        });
        return myItems.some(i => i.status === OrderStatus.PENDING || i.status === OrderStatus.PREPARING);
      });
    } else {
      // Default: count orders that are not ready
      filtered = filtered.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    }
    
    return filtered.length;
  }, [orders, currentUser, menu]);

  if (!currentUser) return null;

  const tId = urlTenantId || business?.slug || business?.id || currentUser?.tenantId;

  const isActive = (path: string) => {
    if (!tId) return location.pathname === path;
    const fullPath = `/${tId}${path === '/' ? '' : path}`;
    return location.pathname === fullPath;
  };

  const navItemClass = (path: string, margin = 'mb-3') => {
    const active = isActive(path);
    return `
      flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 ${margin} group relative border w-full
      ${active 
        ? 'bg-white text-[#1a1a37] shadow-xl border-white' 
        : 'text-white/40 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20'}
    `;
  };

  const permissions = currentUser.permissions || [];
  const activeSubscription = business?.subscription;
  const allowedBySubscription = (moduleId: string) => {
    if (!activeSubscription) return true; // Default to true if legacy or not yet set
    return activeSubscription.allowedPages.includes(moduleId);
  };

  const NavLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="md:hidden text-xs font-bold uppercase tracking-widest">{children}</span>
  );

  const sidebarContent = (
    <div 
      className="h-full flex flex-col items-center py-6 text-white overflow-y-auto no-scrollbar"
      style={{ background: '#11112b' }}
    >
      <div className="mb-8 shrink-0 px-4 w-full flex items-center justify-between md:justify-center">
        {(currentUser.tenantIds && currentUser.tenantIds.length > 1) || currentUser.role === Role.SUPER_ADMIN ? (
          <RestaurantSwitcher />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/20 shrink-0">
              {business.logo ? (
                <img src={business.logo} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
              ) : (
                <UtensilsCrossed size={24} className="text-white/20" />
              )}
            </div>
            <div className="md:hidden">
                 <h1 className="text-sm font-black uppercase tracking-tight leading-none">{business.name || 'RestoKeep'}</h1>
                 <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Management</p>
              </div>
          </div>
        )}
        <button onClick={onClose} className="md:hidden p-2 text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col items-center w-full px-4 no-scrollbar">
            {currentUser.role === Role.SUPER_ADMIN && !urlTenantId ? (
              <>
                <NavLink to="/portal" onClick={() => onClose()} className={navItemClass('/portal')} title="Portal">
                  <ShieldCheck size={22} className="shrink-0" />
                  <NavLabel>Portal</NavLabel>
                </NavLink>
                <NavLink to="/pending-bills" onClick={() => onClose()} className={navItemClass('/pending-bills')} title="Pending Bills">
                  <FileText size={22} className="shrink-0" />
                  <NavLabel>Bills</NavLabel>
                </NavLink>
                <NavLink to="/approved-bills" onClick={() => onClose()} className={navItemClass('/approved-bills')} title="Approved Bills">
                  <CheckCircle size={22} className="shrink-0" />
                  <NavLabel>Approved</NavLabel>
                </NavLink>
                <NavLink to="/platform-expenses" onClick={() => onClose()} className={navItemClass('/platform-expenses')} title="Platform Expenses">
                  <Wallet size={22} className="shrink-0" />
                  <NavLabel>Expenses</NavLabel>
                </NavLink>
                <NavLink to="/global-reports" onClick={() => onClose()} className={navItemClass('/global-reports')} title="Global Reports">
                  <Globe size={22} className="shrink-0" />
                  <NavLabel>Reports</NavLabel>
                </NavLink>
              </>
            ) : currentUser.role === Role.CUSTOMER ? (
              <>
                <NavLink to={`/${tId}/order`} onClick={() => onClose()} className={navItemClass('/order')} title="Digital Menu">
                  <ShoppingBag size={22} className="shrink-0" />
                  <NavLabel>Ordering</NavLabel>
                </NavLink>
                <NavLink to={`/${tId}/order/panel`} onClick={() => onClose()} className={navItemClass('/order/panel')} title="My Tokens">
                  <Timer size={22} className="shrink-0" />
                  <NavLabel>Token Info</NavLabel>
                </NavLink>
                <NavLink to={`/${tId}/order/history`} onClick={() => onClose()} className={navItemClass('/order/history')} title="History">
                  <History size={22} className="shrink-0" />
                  <NavLabel>My Logs</NavLabel>
                </NavLink>
              </>
            ) : (
              <>
                {permissions.includes('Dashboard') && allowedBySubscription('dashboard') && (
                  <NavLink to={`/${tId}/dashboard`} onClick={() => onClose()} className={navItemClass('/dashboard')} title="Dashboard">
                    <LayoutDashboard size={22} className="shrink-0" />
                    <NavLabel>Overview</NavLabel>
                  </NavLink>
                )}
                
                {permissions.includes('POS') && allowedBySubscription('pos') && (
                  <NavLink to={`/${tId}/pos`} onClick={() => onClose()} className={navItemClass('/pos')} title="Terminal">
                    <div className="relative shrink-0">
                      <UtensilsCrossed size={22} />
                      {activeOrdersCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                            {activeOrdersCount}
                          </span>
                      )}
                    </div>
                    <NavLabel>Terminal</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Kitchen') && allowedBySubscription('kitchen') && (
                  <NavLink to={`/${tId}/kitchen`} onClick={() => onClose()} className={navItemClass('/kitchen')} title="Kitchen">
                    <div className="relative shrink-0">
                      <ChefHat size={22} />
                      {activeOrdersCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                            {activeOrdersCount}
                          </span>
                      )}
                    </div>
                    <NavLabel>Cooking</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Billing') && allowedBySubscription('billing') && (
                  <NavLink to={`/${tId}/billing`} onClick={() => onClose()} className={navItemClass('/billing')} title="Billing">
                    <Receipt size={22} className="shrink-0" />
                    <NavLabel>Counter</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Transactions') && allowedBySubscription('billing') && (
                  <NavLink to={`/${tId}/transactions`} onClick={() => onClose()} className={navItemClass('/transactions')} title="History">
                    <History size={22} className="shrink-0" />
                    <NavLabel>Sales Log</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Menu') && allowedBySubscription('menu') && (
                  <NavLink to={`/${tId}/menu`} onClick={() => onClose()} className={navItemClass('/menu')} title="Menu">
                    <MenuIcon size={22} className="shrink-0" />
                    <NavLabel>Menu</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Inventory') && allowedBySubscription('inventory') && (
                  <NavLink to={`/${tId}/inventory`} onClick={() => onClose()} className={navItemClass('/inventory')} title="Inventory">
                    <Package size={22} className="shrink-0" />
                    <NavLabel>Stock Items</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Inventory') && allowedBySubscription('inventory') && (
                  <NavLink to={`/${tId}/sales-items`} onClick={() => onClose()} className={navItemClass('/sales-items')} title="Sales Items">
                    <ShoppingBag size={22} className="shrink-0" />
                    <NavLabel>Product List</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Reports') && allowedBySubscription('reports') && (
                  <NavLink to={`/${tId}/reports`} onClick={() => onClose()} className={navItemClass('/reports')} title="Reports">
                    <PieChart size={22} className="shrink-0" />
                    <NavLabel>Analytics</NavLabel>
                  </NavLink>
                )}

                {currentUser.role === Role.OWNER && currentUser.tenantIds && currentUser.tenantIds.length > 1 && (
                  <NavLink to="/global-reports" onClick={() => onClose()} className={navItemClass('/global-reports')} title="Global Reports">
                    <Globe size={22} className="shrink-0" />
                    <NavLabel>Network Stats</NavLabel>
                  </NavLink>
                )}

                {permissions.includes('Users') && allowedBySubscription('users') && currentUser.role !== Role.SUPER_ADMIN && (
                  <NavLink to={`/${tId}/users`} onClick={() => onClose()} className={navItemClass('/users')} title="Users">
                    <UsersIcon size={22} className="shrink-0" />
                    <NavLabel>Staff List</NavLabel>
                  </NavLink>
                )}

                {currentUser.role === Role.SUPER_ADMIN && (
                  <>
                    <div className="w-full h-px bg-white/10 my-4 shrink-0" />
                    <NavLink to="/portal" onClick={() => onClose()} className={navItemClass('/portal')} title="Back to Portal">
                      <ShieldCheck size={22} className="text-indigo-400 shrink-0" />
                      <NavLabel>Back Portal</NavLabel>
                    </NavLink>
                  </>
                )}
              </>
            )}
        </nav>

        <div className="mt-auto pt-6 space-y-1 flex flex-col items-center shrink-0 px-4 w-full">
            <NavLink to={currentUser.role === Role.SUPER_ADMIN && !urlTenantId ? "/settings" : `/${tId}/settings`} onClick={() => onClose()} className={navItemClass('/settings', 'mb-2')} title="Settings">
                <Settings size={22} className="shrink-0" />
                <NavLabel>Preferences</NavLabel>
            </NavLink>
            
            <div className="w-full mb-3 flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt="User" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <UserCircle size={24} className="text-white/40" />
                )}
              </div>
              <div className="md:hidden">
                <p className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>

            <button 
                onClick={() => {
                  const tId = urlTenantId || currentUser.tenantId;
                  const role = currentUser.role;
                  logout();
                  if (tId && role !== Role.SUPER_ADMIN) {
                    navigate(`/${tId}`);
                  } else {
                    navigate('/login');
                  }
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-white/40 hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/30"
                title="Logout"
            >
                <LogOut size={22} className="shrink-0" />
                <NavLabel>Sign Out</NavLabel>
            </button>
        </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className="hidden md:flex h-screen flex-col items-center py-4 text-white transition-all duration-500 shrink-0 z-[70] shadow-2xl w-20 print:hidden"
        style={{ background: '#11112b' }}
      >
        {sidebarContent}
      </div>

      {/* Mobile Sidebar (Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-[#0a0a1a]/80 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-[101] md:hidden shadow-2xl overflow-hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const ProtectedLayout = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { currentUser, business, setCurrentTenantId, logout, getDefaultRedirect, orders, menu } = useApp();
  const { tenantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  React.useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  const activeOrdersCount = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    const isAdmin = currentUser && [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN].includes(currentUser.role);
    const isKitchen = currentUser?.role === Role.KITCHEN;
    const hasAssignedCats = isKitchen && currentUser?.assignedCategories && currentUser.assignedCategories.length > 0;
    
    if (!isAdmin && !isKitchen && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }

    if (hasAssignedCats) {
      filtered = filtered.filter(order => {
        const items = order.items || [];
        const myItems = items.filter(item => {
          const menuItem = menu.find(m => m.id === item.itemId);
          return menuItem && currentUser.assignedCategories?.includes(menuItem.category);
        });
        return myItems.some(i => i.status === OrderStatus.PENDING || i.status === OrderStatus.PREPARING);
      });
    } else {
      filtered = filtered.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    }
    
    return filtered.length;
  }, [orders, currentUser, menu]);

  if (!currentUser) {
    if (tenantId) {
      return <Navigate to={`/${tenantId}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const tId = tenantId || currentUser.tenantId || business.id;

  if (!tenantId && currentUser.role !== Role.SUPER_ADMIN && currentUser.tenantId) {
    const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname;
    return <Navigate to={`/${currentUser.tenantId}${currentPath}`} replace />;
  }
  
  const isCorrectTenant = tenantId && (
    tenantId === currentUser.tenantId || 
    tenantId === business.id || 
    tenantId === business.slug
  );

    if (tenantId && currentUser.role !== Role.SUPER_ADMIN && !isCorrectTenant) {
    if (!currentUser.tenantId) {
      return <Navigate to="/" replace />;
    }
    
    const currentPath = location.pathname;
    const redirectPath = `/${currentUser.tenantId}/dashboard`;
    
    if (currentPath === redirectPath) {
      return <Navigate to="/" replace />;
    }
    
    return <Navigate to={redirectPath} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const redirectPath = getDefaultRedirect();
    if (redirectPath === location.pathname) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={redirectPath} replace />;
  }

  const permissions = currentUser.permissions || [];
  const activeSubscription = business?.subscription;

  if (currentUser.role !== Role.CUSTOMER) {
    if (currentUser.role === Role.SUPER_ADMIN) {
      if (location.pathname.includes('/users') || location.pathname.endsWith('/users')) {
          return <Navigate to="/" replace />;
      }
    } else {
      const path = location.pathname;
      
      const permissionMap: { [key: string]: string } = {
        'dashboard': 'Dashboard',
        'pos': 'POS',
        'kitchen': 'Kitchen',
        'menu': 'Menu',
        'billing': 'Billing',
        'transactions': 'Transactions',
        'inventory': 'Inventory',
        'reports': 'Reports',
        'global-reports': 'Reports',
        'users': 'Users',
        'expenses': 'Expenses',
        'accounting': 'Accounting',
        'sales-items': 'Inventory',
        'tables': 'Dashboard'
      };

      const currentPathSegment = path.split('/').pop();
      const requiredPermission = currentPathSegment ? permissionMap[currentPathSegment] : null;

      if (activeSubscription && currentPathSegment && !['subscription', 'settings'].includes(currentPathSegment)) {
        let moduleId = currentPathSegment;
        if (moduleId === 'sales-items') moduleId = 'inventory';
        if (moduleId === 'transactions') moduleId = 'billing';
        
        const isAllowedBySubscription = activeSubscription.allowedPages.includes(moduleId);
        
        if (!isAllowedBySubscription) {
          toast.error('This module is not included in your current subscription plan.');
          return <Navigate to={`/${tenantId}/subscription`} replace />;
        }
      }

      if (requiredPermission && !permissions.includes(requiredPermission)) {
        if (permissions.length > 0) {
          const firstPermission = permissions[0].toLowerCase();
          return <Navigate to={`/${currentUser.tenantId}/${firstPermission}`} replace />;
        }
        return <Navigate to="/login" replace />;
      }
    }
  }

  if (!business.isActive && currentUser.role !== Role.SUPER_ADMIN) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <PowerOff size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Account Deactivated</h1>
        <p className="text-slate-500 max-w-md mb-8">
          Your restaurant account has been deactivated by the portal administrator. 
          This usually happens due to pending monthly bills or maintenance.
        </p>
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm mb-8 w-full max-w-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Support</p>
          <p className="text-lg font-black text-slate-900">+1 555-0123</p>
          <p className="text-sm text-indigo-600 font-medium">support@portal.com</p>
        </div>
        <button 
          onClick={() => window.location.href = tenantId ? `/login?tenantId=${tenantId}` : '/login'}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (business.isMaintenanceMode && currentUser.role !== Role.SUPER_ADMIN) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 z-[999]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl border-4 border-amber-500 relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center text-center overflow-y-auto no-scrollbar">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-4 border-amber-100 shrink-0">
              <AlertTriangle size={32} className="text-amber-600" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none shrink-0">
              Under <span className="text-amber-600">Maintenance</span>
            </h2>
            
            <div className="w-10 h-1 bg-amber-500 rounded-full mb-6 shrink-0" />
            
            <div className="space-y-4 mb-8">
              <p className="text-slate-600 font-bold text-sm md:text-base leading-relaxed">
                {business.maintenanceMessage || "We are currently performing some updates to improve your experience."}
              </p>
              
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 inline-block w-full">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Estimated Back Online</p>
                <p className="text-lg font-black text-slate-900 uppercase">
                  {business.maintenanceTime || "Coming Back Soon"}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all active:scale-95 shrink-0"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const allowedBySubscription = (moduleId: string) => {
    if (!activeSubscription) return true;
    return activeSubscription.allowedPages.includes(moduleId);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center p-0.5 bg-[#11112b] text-white shrink-0 shadow-lg border-b border-white/5">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <MenuIcon size={24} />
        </button>

        <div className="flex items-center gap-0.5 ml-auto">
            {permissions.includes('POS') && allowedBySubscription('pos') && (
            <NavLink 
              to={`/${tId}/pos`} 
              className={({ isActive }) => `p-2 rounded-xl transition-all relative ${isActive ? 'bg-white text-[#11112b]' : 'text-white/40 hover:bg-white/10'}`}
            >
              <UtensilsCrossed size={20} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-[#11112b]">
                  {activeOrdersCount}
                </span>
              )}
            </NavLink>
          )}
          
          {permissions.includes('Kitchen') && allowedBySubscription('kitchen') && (
            <NavLink 
              to={`/${tId}/kitchen`} 
              className={({ isActive }) => `p-2 rounded-xl transition-all relative ${isActive ? 'bg-white text-[#11112b]' : 'text-white/40 hover:bg-white/10'}`}
            >
              <ChefHat size={20} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-[#11112b]">
                  {activeOrdersCount}
                </span>
              )}
            </NavLink>
          )}
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-auto relative">
        {React.Children.map(children, child => 
          React.isValidElement(child) 
            ? React.cloneElement(child, { setIsSidebarOpen } as any) 
            : child
        )}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, isLoading, isAuthReady, business, currentTenantId, setCurrentTenantId, getDefaultRedirect, logout, tenants } = useApp();
  const location = useLocation();

  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const pathTenantId = pathSegments[0];
    
    // Reserved words that are not tenant IDs
    const reservedWords = ['login', 'portal', 'order', 'pending-bills', 'approved-bills', 'platform-expenses', 'global-reports', 'dashboard', 'pos', 'kitchen', 'menu', 'inventory', 'billing', 'transactions', 'expenses', 'reports', 'users', 'settings'];
    
    const tenantId = searchParams.get('tenantId') || (pathTenantId && !reservedWords.includes(pathTenantId) ? pathTenantId : null);
    
    if (tenantId) {
      console.log('[AppContent] Identified tenantId:', tenantId, 'from path:', pathTenantId);
    }
    
    // Warn if user is logged into a different restaurant and tries to access login page
    if (tenantId && currentUser && currentUser.role !== Role.SUPER_ADMIN && location.pathname.includes('/login')) {
      const targetTenant = tenants.find(t => t.id === tenantId || t.slug === tenantId);
      const targetId = targetTenant?.id || tenantId;
      
      if (targetId !== currentUser.tenantId) {
        console.warn('[AppContent] Tenant mismatch detected on login page.', {
          urlTenant: tenantId,
          targetId,
          currentUserTenant: currentUser.tenantId
        });
        toast.error(`You are already logged in to another restaurant. Please log out if you wish to switch.`);
        return;
      }
    }
    
    if (tenantId && tenantId !== currentTenantId) {
      console.log('[AppContent] Syncing tenantId from URL:', tenantId);
      setCurrentTenantId(tenantId);
    } else if (!tenantId && (location.pathname === '/login' || location.pathname === '/portal') && currentTenantId) {
      console.log('[AppContent] Clearing tenantId for system page');
      setCurrentTenantId(null);
    }
  }, [location.search, location.pathname, currentTenantId, setCurrentTenantId, currentUser, tenants, logout]);

  React.useEffect(() => {
    if (business.name) {
      document.title = business.name;
      const appleTitle = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement;
      if (appleTitle) appleTitle.content = business.name;
    } else {
      document.title = 'RestoKeep';
    }

    if (business.logo) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = business.logo;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = business.logo;
        document.head.appendChild(newLink);
      }

      // Dynamic apple-touch-icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIcon) {
        appleIcon.href = business.logo;
      } else {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = business.logo;
        document.head.appendChild(appleIcon);
      }
    }

    // Dynamic Manifest for "Add to Home Screen"
    const tenantId = business.id || 'default';
    const manifest = {
      id: `restokeep-tenant-${tenantId}`,
      short_name: business.name || 'RestoKeep',
      name: business.name ? `${business.name} - RestoKeep` : 'RestoKeep Management',
      icons: [
        {
          src: business.logo || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=192&h=192&auto=format&fit=crop',
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: business.logo || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=512&h=512&auto=format&fit=crop',
          type: "image/png",
          sizes: "512x512",
          purpose: "any maskable"
        }
      ],
      start_url: business.id ? `${window.location.origin}${window.location.pathname}#/${business.id}` : window.location.href,
      display: "standalone",
      theme_color: "#11112b",
      background_color: "#ffffff",
      scope: "/"
    };

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = manifestURL;
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestURL;
      document.head.appendChild(manifestLink);
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [business.name, business.logo, location.pathname, location.search, location.hash]);

  if (isLoading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {business.logo ? (
            <img src={business.logo} alt="Logo" className="w-20 h-20 object-contain animate-pulse" />
          ) : (
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={currentUser ? (location.pathname === '/' && getDefaultRedirect() === '/' ? <Landing /> : <Navigate to={getDefaultRedirect()} />) : <Landing />} />
      <Route path="/login" element={currentUser ? <Navigate to={getDefaultRedirect()} /> : <Login />} />
      <Route path="/order/auth" element={currentUser ? <Navigate to={currentUser.role === Role.CUSTOMER ? `/${currentUser.tenantId}/order` : "/"} /> : <CustomerAuth />} />
      
      {/* Tenant-specific customer routes */}
      <Route path="/:tenantId/order/auth" element={currentUser ? <Navigate to={`/${currentUser.tenantId}/order`} /> : <CustomerAuth />} />
      <Route path="/:tenantId/order" element={
        <ProtectedLayout allowedRoles={[Role.CUSTOMER]}>
          <CustomerOrder />
        </ProtectedLayout>
      } />
      <Route path="/:tenantId/order/panel" element={
        <ProtectedLayout allowedRoles={[Role.CUSTOMER]}>
          <CustomerPanel />
        </ProtectedLayout>
      } />
      <Route path="/:tenantId/order/history" element={
        <ProtectedLayout allowedRoles={[Role.CUSTOMER]}>
          <CustomerHistory />
        </ProtectedLayout>
      } />

      <Route path="/order" element={
        currentUser && currentUser.role === Role.CUSTOMER 
          ? <Navigate to={`/${currentUser.tenantId}/order`} />
          : <Navigate to="/order/auth" />
      } />

      {/* Tenant-specific business routes */}
      <Route path="/:tenantId/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/:tenantId/pos" element={<ProtectedLayout><POS /></ProtectedLayout>} />
      <Route path="/:tenantId/kitchen" element={<ProtectedLayout><Kitchen /></ProtectedLayout>} />
      <Route path="/:tenantId/menu" element={<ProtectedLayout><MenuManagement /></ProtectedLayout>} />
      <Route path="/:tenantId/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
      <Route path="/:tenantId/sales-items" element={<ProtectedLayout><SalesItems /></ProtectedLayout>} />
      <Route path="/:tenantId/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
      <Route path="/:tenantId/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
      <Route path="/:tenantId/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
      <Route path="/:tenantId/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
            <Route path="/:tenantId/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
      {/* <Route path="/:tenantId/subscription" element={<ProtectedLayout><Subscription /></ProtectedLayout>} /> */}
      <Route path="/:tenantId/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

      {/* Legacy routes for backward compatibility or direct access */}
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/pos" element={<ProtectedLayout><POS /></ProtectedLayout>} />
      <Route path="/kitchen" element={<ProtectedLayout><Kitchen /></ProtectedLayout>} />
      <Route path="/menu" element={<ProtectedLayout><MenuManagement /></ProtectedLayout>} />
      <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
      <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
      <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
      <Route path="/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
            <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

      <Route path="/portal" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><SuperAdmin /></ProtectedLayout>} />
      <Route path="/pending-bills" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><PendingBills /></ProtectedLayout>} />
      <Route path="/approved-bills" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><ApprovedBills /></ProtectedLayout>} />
      <Route path="/platform-expenses" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><PlatformExpenses /></ProtectedLayout>} />
      <Route path="/global-reports" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN, Role.OWNER]}><GlobalReports /></ProtectedLayout>} />
      <Route path="/:tenantId" element={<TenantLanding />} />
    </Routes>
  );
}

import { Toaster } from 'sonner';
import { PrinterRelay } from './src/components/PrinterRelay';

const OfflineAlert = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-rose-600 text-white px-6 py-2 flex items-center justify-center gap-3 shadow-lg"
        >
          <AlertTriangle size={14} className="animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Offline! Data will update when online
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <AppProvider>
        <OfflineAlert />
        <PrinterRelay />
        <AppContent />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </Router>
  );
}
