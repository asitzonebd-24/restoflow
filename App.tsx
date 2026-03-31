
import React, { useState, useMemo } from 'react';
import { auth, db } from './src/firebase';
import { HashRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Role, OrderStatus } from './types';
import { LayoutDashboard, UtensilsCrossed, ChefHat, Receipt, Package, LogOut, Settings, Users as UsersIcon, History, Wallet, PieChart, Menu as MenuIcon, User as UserCircle, ShieldCheck, PowerOff, FileText, CheckCircle, Menu, X, Utensils, ShoppingBag, Timer } from 'lucide-react';

import { collection, addDoc } from "firebase/firestore";

// Run test on load
// testFirestore();
const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { business, currentUser, logout, orders, categories, setActiveCategory, activeCategory } = useApp();
  const location = useLocation();
  const { tenantId: urlTenantId } = useParams();
  const navigate = useNavigate();

  const activeOrdersCount = useMemo(() => {
    let filtered = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    
    // Only Owner, Manager, Kitchen, and Super Admin can see all orders
    const canSeeAll = currentUser && [Role.OWNER, Role.MANAGER, Role.KITCHEN, Role.SUPER_ADMIN].includes(currentUser.role);
    
    if (!canSeeAll && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }
    
    return filtered.length;
  }, [orders, currentUser]);

  if (!currentUser) return null;

  const tId = urlTenantId || currentUser.tenantId;

  const isActive = (path: string) => {
    if (!tId) return location.pathname === path;
    const fullPath = `/${tId}${path === '/' ? '' : path}`;
    return location.pathname === fullPath;
  };

  const navItemClass = (path: string, margin = 'mb-3') => {
    const active = isActive(path);
    return `
      flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${margin} group relative border
      ${active 
        ? 'bg-white text-[#1a1a37] shadow-xl border-white' 
        : 'text-white/40 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20'}
    `;
  };

  const permissions = currentUser.permissions || [];

  return (
    <div 
      className="sticky top-0 left-0 h-screen flex flex-col items-center py-4 text-white transition-all duration-500 shrink-0 z-[70] shadow-2xl w-20 print:hidden"
      style={{ background: '#11112b' }}
    >
      <div className="mb-4 shrink-0 cursor-pointer" onClick={() => { logout(); navigate('/login'); }}>
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            {business.logo ? (
              <img src={business.logo} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <UtensilsCrossed size={24} className="text-white/20" />
            )}
          </div>
      </div>

      <nav className="flex-1 flex flex-col items-center overflow-y-auto w-full px-2 no-scrollbar">
            {currentUser.role === Role.SUPER_ADMIN && !urlTenantId ? (
              <>
                <NavLink to="/portal" onClick={() => onClose()} className={navItemClass('/portal')} title="Portal">
                  <ShieldCheck size={22} />
                </NavLink>
                <NavLink to="/pending-bills" onClick={() => onClose()} className={navItemClass('/pending-bills')} title="Pending Bills">
                  <FileText size={22} />
                </NavLink>
                <NavLink to="/approved-bills" onClick={() => onClose()} className={navItemClass('/approved-bills')} title="Approved Bills">
                  <CheckCircle size={22} />
                </NavLink>
                <NavLink to="/platform-expenses" onClick={() => onClose()} className={navItemClass('/platform-expenses')} title="Platform Expenses">
                  <Wallet size={22} />
                </NavLink>
              </>
            ) : currentUser.role === Role.CUSTOMER ? (
              <>
                <NavLink to={`/${tId}/order`} onClick={() => onClose()} className={navItemClass('/order')} title="Digital Menu">
                  <ShoppingBag size={22} />
                </NavLink>
                <NavLink to={`/${tId}/order/panel`} onClick={() => onClose()} className={navItemClass('/order/panel')} title="My Tokens">
                  <Timer size={22} />
                </NavLink>
                <NavLink to={`/${tId}/order/history`} onClick={() => onClose()} className={navItemClass('/order/history')} title="History">
                  <History size={22} />
                </NavLink>
              </>
            ) : (
              <>
                {permissions.includes('Dashboard') && (
                  <NavLink to={`/${tId}/dashboard`} onClick={() => onClose()} className={navItemClass('/dashboard')} title="Dashboard">
                    <LayoutDashboard size={22} />
                  </NavLink>
                )}
                
                {permissions.includes('POS') && (
                  <NavLink to={`/${tId}/pos`} onClick={() => onClose()} className={navItemClass('/pos')} title="Terminal">
                    <UtensilsCrossed size={22} />
                    {activeOrdersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#11112b]">
                          {activeOrdersCount}
                        </span>
                    )}
                  </NavLink>
                )}

                {permissions.includes('Kitchen') && (
                  <NavLink to={`/${tId}/kitchen`} onClick={() => onClose()} className={navItemClass('/kitchen')} title="Kitchen">
                    <ChefHat size={22} />
                    {activeOrdersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#11112b]">
                          {activeOrdersCount}
                        </span>
                    )}
                  </NavLink>
                )}

                {permissions.includes('Billing') && (
                  <NavLink to={`/${tId}/billing`} onClick={() => onClose()} className={navItemClass('/billing')} title="Billing">
                    <Receipt size={22} />
                  </NavLink>
                )}

                {permissions.includes('Transactions') && (
                  <NavLink to={`/${tId}/transactions`} onClick={() => onClose()} className={navItemClass('/transactions')} title="History">
                    <History size={22} />
                  </NavLink>
                )}

                {permissions.includes('Menu') && (
                  <NavLink to={`/${tId}/menu`} onClick={() => onClose()} className={navItemClass('/menu')} title="Menu">
                    <MenuIcon size={22} />
                  </NavLink>
                )}

                {permissions.includes('Inventory') && (
                  <NavLink to={`/${tId}/inventory`} onClick={() => onClose()} className={navItemClass('/inventory')} title="Inventory">
                    <Package size={22} />
                  </NavLink>
                )}

                {permissions.includes('Inventory') && (
                  <NavLink to={`/${tId}/sales-items`} onClick={() => onClose()} className={navItemClass('/sales-items')} title="Sales Items">
                    <ShoppingBag size={22} />
                  </NavLink>
                )}

                {permissions.includes('Reports') && (
                  <NavLink to={`/${tId}/reports`} onClick={() => onClose()} className={navItemClass('/reports')} title="Reports">
                    <PieChart size={22} />
                  </NavLink>
                )}

                {permissions.includes('Users') && (
                  <NavLink to={`/${tId}/users`} onClick={() => onClose()} className={navItemClass('/users')} title="Users">
                    <UsersIcon size={22} />
                  </NavLink>
                )}

                {currentUser.role === Role.CUSTOMER && (
                  <>
                    <NavLink to={`/${tId}/order`} onClick={() => onClose()} className={navItemClass('/order')} title="Digital Menu">
                      <Utensils size={22} />
                    </NavLink>
                    <NavLink to={`/${tId}/order/panel`} onClick={() => onClose()} className={navItemClass('/order/panel')} title="My Tokens">
                      <Timer size={22} />
                    </NavLink>
                    <NavLink to={`/${tId}/order/history`} onClick={() => onClose()} className={navItemClass('/order/history')} title="History">
                      <History size={22} />
                    </NavLink>
                    <div className="w-full px-2 mt-4">
                      <select 
                        className="w-full bg-white/10 text-white text-[10px] p-2 rounded-lg border border-white/20"
                        value={activeCategory}
                        onChange={(e) => {
                          setActiveCategory(e.target.value);
                          if (!location.pathname.includes('/order')) navigate(`/${tId}/order`);
                        }}
                      >
                        <option value="All">All</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {currentUser.role === Role.SUPER_ADMIN && (
                  <>
                    <div className="w-10 h-px bg-white/10 my-4 shrink-0" />
                    <NavLink to="/portal" onClick={() => onClose()} className={navItemClass('/portal')} title="Back to Portal">
                      <ShieldCheck size={22} className="text-indigo-400" />
                    </NavLink>
                  </>
                )}
              </>
            )}
        </nav>

        <div className="mt-auto pt-2 space-y-1 flex flex-col items-center shrink-0">
            <NavLink to={currentUser.role === Role.SUPER_ADMIN && !urlTenantId ? "/settings" : `/${tId}/settings`} onClick={() => onClose()} className={navItemClass('/settings', 'mb-0')} title="Settings">
                <Settings size={22} />
            </NavLink>
            
            <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5 flex items-center justify-center overflow-hidden">
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
                }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/40 hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                title="Logout"
            >
                <LogOut size={22} />
            </button>
        </div>
      </div>
    );
};

const ProtectedLayout = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { currentUser, business, setCurrentTenantId } = useApp();
  const { tenantId } = useParams();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  React.useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  if (!currentUser) {
    // Redirect to the tenant landing page if tenantId is present
    if (tenantId) {
      return <Navigate to={`/${tenantId}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // If no tenantId in URL, redirect non-Super Admins to their tenant-specific route
  if (!tenantId && currentUser.role !== Role.SUPER_ADMIN && currentUser.tenantId) {
    const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname;
    return <Navigate to={`/${currentUser.tenantId}${currentPath}`} replace />;
  }
  
  // If tenantId is in URL, ensure it matches user's tenant (unless Super Admin)
  if (tenantId && currentUser.role !== Role.SUPER_ADMIN && currentUser.tenantId !== tenantId) {
    return <Navigate to={`/${currentUser.tenantId}/dashboard`} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // Check permissions for business users (Super Admin bypasses)
  if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.CUSTOMER) {
    const path = location.pathname;
    const permissions = currentUser.permissions || [];
    
    const permissionMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'pos': 'POS',
      'kitchen': 'Kitchen',
      'menu': 'Menu',
      'billing': 'Billing',
      'transactions': 'Transactions',
      'inventory': 'Inventory',
      'reports': 'Reports',
      'users': 'Users',
      'expenses': 'Expenses'
    };

    const currentPathSegment = path.split('/').pop();
    const requiredPermission = currentPathSegment ? permissionMap[currentPathSegment] : null;

    if (requiredPermission && !permissions.includes(requiredPermission)) {
      // Redirect to the first available permission or login
      if (permissions.length > 0) {
        const firstPermission = permissions[0].toLowerCase();
        return <Navigate to={`/${currentUser.tenantId}/${firstPermission}`} replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // Check if business is active (Super Admin can always access)
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
          onClick={() => window.location.href = tenantId ? `/#/login?tenantId=${tenantId}` : '/#/login'}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const isCustomer = currentUser.role === Role.CUSTOMER;
  
  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden flex-row`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
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
  const { currentUser, isLoading, business, currentTenantId } = useApp();
  const location = useLocation();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connecting to Cloud...</p>
        </div>
      </div>
    );
  }

  const getDefaultRedirect = () => {
    if (!currentUser) return "/";
    
    // If Super Admin is in a tenant context, go to that tenant's dashboard
    if (currentUser.role === Role.SUPER_ADMIN) {
      if (currentTenantId && currentTenantId !== '00') {
        return `/${currentTenantId}/dashboard`;
      }
      return "/portal";
    }
    
    if (currentUser.role === Role.CUSTOMER) return `/${currentUser.tenantId}/order`;
    
    const permissions = currentUser.permissions || [];
    if (permissions.includes('Dashboard')) return `/${currentUser.tenantId}/dashboard`;
    if (permissions.includes('POS')) return `/${currentUser.tenantId}/pos`;
    if (permissions.length > 0) return `/${currentUser.tenantId}/${permissions[0].toLowerCase()}`;
    
    return "/login";
  };

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to={getDefaultRedirect()} /> : <Landing />} />
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
      <Route path="/:tenantId" element={<TenantLanding />} />
    </Routes>
  );
}

import { Toaster } from 'sonner';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
        <Toaster position="top-right" richColors />
      </Router>
    </AppProvider>
  );
}
