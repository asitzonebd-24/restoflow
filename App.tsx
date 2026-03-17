
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
    flex items-center gap-3 px-3 py-3 md:px-4 rounded-xl transition-all duration-200 mb-1 justify-center md:justify-start group
    ${isActive(path) 
      ? 'bg-white text-slate-900 shadow-md font-bold' 
      : 'text-white/70 hover:bg-white/10 hover:text-white'}
  `;

  const permissions = currentUser.permissions || [];

  return (
    <div 
      className="w-20 md:w-64 h-screen flex flex-col p-2 md:p-4 text-white transition-all duration-300 shrink-0"
      style={{ backgroundColor: business.themeColor }}
    >
      <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-white/20 justify-center md:justify-start overflow-hidden">
        <img src={business.logo} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white p-1 shrink-0" />
        <div className="hidden md:block truncate">
          <h2 className="font-bold text-lg leading-tight truncate">{business.name}</h2>
          <p className="text-xs text-white/60">{currentUser.role === Role.SUPER_ADMIN ? 'Portal Admin' : 'Staff Terminal'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar">
        {currentUser.role === Role.SUPER_ADMIN && (
          <>
            <NavLink to="/portal" className={navItemClass('/portal')} title="Portal">
              <ShieldCheck size={20} className="shrink-0" /> <span className="hidden md:block">Portal</span>
            </NavLink>
            <NavLink to="/pending-bills" className={navItemClass('/pending-bills')} title="Pending Bills">
              <FileText size={20} className="shrink-0" /> <span className="hidden md:block">Pending Bills</span>
            </NavLink>
            <NavLink to="/approved-bills" className={navItemClass('/approved-bills')} title="Approved Bills">
              <CheckCircle size={20} className="shrink-0" /> <span className="hidden md:block">Approved Bills</span>
            </NavLink>
          </>
        )}

        {permissions.includes('Dashboard') && (
          <NavLink to="/dashboard" className={navItemClass('/dashboard')} title="Dashboard">
            <LayoutDashboard size={20} className="shrink-0" /> <span className="hidden md:block">Dashboard</span>
          </NavLink>
        )}
        
        {permissions.includes('POS') && (
          <NavLink to="/pos" className={navItemClass('/pos')} title="Terminal">
            <UtensilsCrossed size={20} className="shrink-0" /> <span className="hidden md:block">Terminal</span>
          </NavLink>
        )}

        {permissions.includes('Kitchen') && (
          <NavLink to="/kitchen" className={navItemClass('/kitchen')} title="Kitchen">
            <ChefHat size={20} className="shrink-0" /> <span className="hidden md:block">Kitchen</span>
          </NavLink>
        )}

        {permissions.includes('Menu') && (
          <NavLink to="/menu" className={navItemClass('/menu')} title="Menu">
            <MenuIcon size={20} className="shrink-0" /> <span className="hidden md:block">Menu</span>
          </NavLink>
        )}

        {permissions.includes('Billing') && (
          <NavLink to="/billing" className={navItemClass('/billing')} title="Billing">
            <Receipt size={20} className="shrink-0" /> <span className="hidden md:block">Billing</span>
          </NavLink>
        )}

        {permissions.includes('Transactions') && (
          <NavLink to="/transactions" className={navItemClass('/transactions')} title="History">
            <History size={20} className="shrink-0" /> <span className="hidden md:block">History</span>
          </NavLink>
        )}

        {permissions.includes('Expenses') && (
          <NavLink to="/expenses" className={navItemClass('/expenses')} title="Expenses">
            <Wallet size={20} className="shrink-0" /> <span className="hidden md:block">Expenses</span>
          </NavLink>
        )}

        {permissions.includes('Inventory') && (
           <NavLink to="/inventory" className={navItemClass('/inventory')} title="Inventory">
            <Package size={20} className="shrink-0" /> <span className="hidden md:block">Inventory</span>
          </NavLink>
        )}

        {permissions.includes('Reports') && (
          <NavLink to="/reports" className={navItemClass('/reports')} title="Reports">
            <PieChart size={20} className="shrink-0" /> <span className="hidden md:block">Reports</span>
          </NavLink>
        )}

        {permissions.includes('Users') && (
          <NavLink to="/users" className={navItemClass('/users')} title="Staff">
            <UsersIcon size={20} className="shrink-0" /> <span className="hidden md:block">Staff</span>
          </NavLink>
        )}

        {permissions.includes('Settings') && (
          <NavLink to="/settings" className={navItemClass('/settings')} title="Settings">
            <Settings size={20} className="shrink-0" /> <span className="hidden md:block">Settings</span>
          </NavLink>
        )}
      </nav>

      <div className="pt-4 border-t border-white/20">
         {/* Connection Status */}
         <div className="hidden md:flex flex-col gap-2 px-4 py-3 mb-4 bg-black/20 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
               <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Database</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.isConfigured ? (dbStatus.hasTables ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-red-400'}`}></div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${dbStatus.isConfigured ? (dbStatus.hasTables ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}>
                     {dbStatus.isConfigured ? (dbStatus.hasTables ? 'Connected' : 'Tables Missing') : 'Not Configured'}
                  </span>
               </div>
            </div>
            {!dbStatus.hasTables && dbStatus.isConfigured && (
              <p className="text-[7px] text-amber-200/60 font-medium leading-tight">
                Tables missing in Supabase. Run the SQL schema to enable saving.
              </p>
            )}
         </div>

         <div className="flex items-center gap-3 px-2 mb-4 justify-center md:justify-start">
            <img src={currentUser.avatar} className="w-8 h-8 rounded-full shrink-0 border-2 border-white/20" />
            <div className="hidden md:block overflow-hidden">
               <p className="text-sm font-bold truncate">{currentUser.name}</p>
               <p className="text-[10px] text-white/60 truncate uppercase">{currentUser.role}</p>
            </div>
         </div>
         <button 
           onClick={logout}
           className="w-full flex items-center gap-2 px-2 md:px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 transition text-sm justify-center md:justify-start font-bold uppercase tracking-widest text-[10px]"
         >
           <LogOut size={16} className="shrink-0" /> <span className="hidden md:block">Sign Out</span>
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
