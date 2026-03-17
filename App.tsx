
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { isSupabaseConfigured } from './supabase';
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
import { Users as UsersPage } from './pages/Users';
import { Settings as SettingsPage } from './pages/Settings';
import { CustomerOrder } from './pages/CustomerOrder';
import { CustomerAuth } from './pages/CustomerAuth';
import { CustomerPanel } from './pages/CustomerPanel';
import { CustomerHistory } from './pages/CustomerHistory';
import { SuperAdmin } from './pages/SuperAdmin';
import { PendingBills } from './pages/PendingBills';
import { ApprovedBills } from './pages/ApprovedBills';
import { Role } from './types';
import { LayoutDashboard, UtensilsCrossed, ChefHat, Receipt, Package, LogOut, Settings, Users as UsersIcon, History, Wallet, PieChart, Menu as MenuIcon, User as UserCircle, ShieldCheck, PowerOff, FileText, CheckCircle } from 'lucide-react';

const Sidebar = () => {
  const { business, currentUser, logout, dbStatus } = useApp();
  const location = useLocation();

  if (!currentUser || currentUser.role === Role.CUSTOMER) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mb-1 justify-center md:justify-start group
    ${isActive(path) 
      ? 'bg-white/15 text-white shadow-sm font-semibold' 
      : 'text-white/60 hover:bg-white/5 hover:text-white'}
  `;

  const permissions = currentUser.permissions || [];

  return (
    <div 
      className="w-20 md:w-64 h-screen flex flex-col p-3 md:p-5 text-white transition-all duration-300 shrink-0 shadow-2xl z-20"
      style={{ backgroundColor: business.themeColor }}
    >
      <div className="flex items-center gap-3 px-2 py-6 mb-8 border-b border-white/10 justify-center md:justify-start overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 shrink-0 border border-white/10 shadow-inner">
          <img src={business.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="hidden md:block truncate">
          <h2 className="font-bold text-base leading-tight truncate tracking-tight">{business.name}</h2>
          <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-0.5">
            {currentUser.role === Role.SUPER_ADMIN ? 'Portal Admin' : 'Staff Terminal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">
        {currentUser.role === Role.SUPER_ADMIN && (
          <div className="mb-6">
            <p className="hidden md:block px-4 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Administration</p>
            <NavLink to="/portal" className={navItemClass('/portal')} title="Portal">
              <ShieldCheck size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Portal</span>
            </NavLink>
            <NavLink to="/pending-bills" className={navItemClass('/pending-bills')} title="Pending Bills">
              <FileText size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Pending Bills</span>
            </NavLink>
            <NavLink to="/approved-bills" className={navItemClass('/approved-bills')} title="Approved Bills">
              <CheckCircle size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Approved Bills</span>
            </NavLink>
          </div>
        )}

        <div className="mb-6">
          <p className="hidden md:block px-4 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Operations</p>
          {permissions.includes('Dashboard') && (
            <NavLink to="/dashboard" className={navItemClass('/dashboard')} title="Dashboard">
              <LayoutDashboard size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Dashboard</span>
            </NavLink>
          )}
          
          {permissions.includes('POS') && (
            <NavLink to="/pos" className={navItemClass('/pos')} title="Terminal">
              <UtensilsCrossed size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Terminal</span>
            </NavLink>
          )}

          {permissions.includes('Kitchen') && (
            <NavLink to="/kitchen" className={navItemClass('/kitchen')} title="Kitchen">
              <ChefHat size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Kitchen</span>
            </NavLink>
          )}
        </div>

        <div className="mb-6">
          <p className="hidden md:block px-4 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Management</p>
          {permissions.includes('Menu') && (
            <NavLink to="/menu" className={navItemClass('/menu')} title="Menu">
              <MenuIcon size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Menu</span>
            </NavLink>
          )}

          {permissions.includes('Billing') && (
            <NavLink to="/billing" className={navItemClass('/billing')} title="Billing">
              <Receipt size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Billing</span>
            </NavLink>
          )}

          {permissions.includes('Inventory') && (
            <NavLink to="/inventory" className={navItemClass('/inventory')} title="Inventory">
              <Package size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Inventory</span>
            </NavLink>
          )}
        </div>

        <div className="mb-6">
          <p className="hidden md:block px-4 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Finance & Staff</p>
          {permissions.includes('Transactions') && (
            <NavLink to="/transactions" className={navItemClass('/transactions')} title="History">
              <History size={18} className="shrink-0" /> <span className="hidden md:block text-sm">History</span>
            </NavLink>
          )}

          {permissions.includes('Expenses') && (
            <NavLink to="/expenses" className={navItemClass('/expenses')} title="Expenses">
              <Wallet size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Expenses</span>
            </NavLink>
          )}

          {permissions.includes('Reports') && (
            <NavLink to="/reports" className={navItemClass('/reports')} title="Reports">
              <PieChart size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Reports</span>
            </NavLink>
          )}

          {permissions.includes('Users') && (
            <NavLink to="/users" className={navItemClass('/users')} title="Staff">
              <UsersIcon size={18} className="shrink-0" /> <span className="hidden md:block text-sm">Staff</span>
            </NavLink>
          )}
        </div>
      </nav>

      <div className="pt-6 border-t border-white/10 space-y-4">
         {/* Connection Status */}
         <div className="hidden md:flex flex-col gap-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
               <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Database</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.isConfigured ? (dbStatus.hasTables ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-red-400'}`}></div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${dbStatus.isConfigured ? (dbStatus.hasTables ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}>
                     {dbStatus.isConfigured ? (dbStatus.hasTables ? 'Live' : 'Sync Error') : 'Offline'}
                  </span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3 px-2 justify-center md:justify-start">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-xl shrink-0 border border-white/10 shadow-lg" />
            <div className="hidden md:block overflow-hidden">
               <p className="text-sm font-bold truncate tracking-tight">{currentUser.name}</p>
               <p className="text-[10px] text-white/40 font-medium truncate uppercase tracking-widest">{currentUser.role}</p>
            </div>
         </div>
         
         <button 
           onClick={logout}
           className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm justify-center md:justify-start font-semibold"
         >
           <LogOut size={18} className="shrink-0" /> <span className="hidden md:block">Sign Out</span>
         </button>
      </div>
    </div>
  );
};

const ProtectedLayout = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { currentUser, business } = useApp();
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
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
          onClick={() => window.location.href = '/#/login'}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const isCustomer = currentUser.role === Role.CUSTOMER;
  
  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden ${isCustomer ? 'flex-col' : 'flex-row'}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  const getDefaultRedirect = () => {
    if (!currentUser) return "/";
    if (currentUser.role === Role.SUPER_ADMIN) return "/portal";
    if (currentUser.role === Role.CUSTOMER) return "/order";
    if (currentUser.permissions?.includes('Dashboard')) return "/dashboard";
    return "/pos"; 
  };

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to={getDefaultRedirect()} /> : <Landing />} />
      <Route path="/login" element={currentUser ? <Navigate to={getDefaultRedirect()} /> : <Login />} />
      <Route path="/order/auth" element={currentUser ? <Navigate to="/order" /> : <CustomerAuth />} />
      
      <Route path="/order" element={
        currentUser && currentUser.role === Role.CUSTOMER 
          ? <CustomerOrder /> 
          : <Navigate to="/order/auth" />
      } />
      <Route path="/order/panel" element={
        currentUser && currentUser.role === Role.CUSTOMER 
          ? <CustomerPanel /> 
          : <Navigate to="/order/auth" />
      } />
      <Route path="/order/history" element={
        currentUser && currentUser.role === Role.CUSTOMER 
          ? <CustomerHistory /> 
          : <Navigate to="/order/auth" />
      } />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/portal" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><SuperAdmin /></ProtectedLayout>} />
      <Route path="/pending-bills" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><PendingBills /></ProtectedLayout>} />
      <Route path="/approved-bills" element={<ProtectedLayout allowedRoles={[Role.SUPER_ADMIN]}><ApprovedBills /></ProtectedLayout>} />
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
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
