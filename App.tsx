
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { TenantLanding } from './pages/TenantLanding';
import { PendingBills } from './pages/PendingBills';
import { ApprovedBills } from './pages/ApprovedBills';
import { Role } from './types';
import { LayoutDashboard, UtensilsCrossed, ChefHat, Receipt, Package, LogOut, Settings, Users as UsersIcon, History, Wallet, PieChart, Menu as MenuIcon, User as UserCircle, ShieldCheck, PowerOff, FileText, CheckCircle, Menu, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { business, currentUser, logout } = useApp();
  const location = useLocation();

  if (!currentUser || currentUser.role === Role.CUSTOMER) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 mb-4 group relative
    ${isActive(path) 
      ? 'bg-white text-[#1a1a37] shadow-xl' 
      : 'text-white/40 hover:bg-white/10 hover:text-white'}
  `;

  const permissions = currentUser.permissions || [];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] md:hidden"
          />
        )}
      </AnimatePresence>

      <div 
        className={`fixed md:relative top-0 left-0 h-screen flex flex-col items-center py-8 text-white transition-all duration-500 shrink-0 z-[70] shadow-2xl w-20 print:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#11112b' }}
      >
        <div className="mb-12">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 p-1">
              <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} alt="User" className="w-full h-full object-cover rounded-full" />
            </div>
        </div>

        <nav className="flex-1 flex flex-col items-center no-scrollbar">
            {permissions.includes('Dashboard') && (
              <NavLink to="/dashboard" onClick={() => onClose()} className={navItemClass('/dashboard')} title="Dashboard">
                <LayoutDashboard size={22} />
              </NavLink>
            )}
            
            {permissions.includes('POS') && (
              <NavLink to="/pos" onClick={() => onClose()} className={navItemClass('/pos')} title="Terminal">
                <UtensilsCrossed size={22} />
              </NavLink>
            )}

            {permissions.includes('Kitchen') && (
              <NavLink to="/kitchen" onClick={() => onClose()} className={navItemClass('/kitchen')} title="Kitchen">
                <ChefHat size={22} />
              </NavLink>
            )}

            <div className="w-10 h-px bg-white/10 my-4" />

            {permissions.includes('Menu') && (
              <NavLink to="/menu" onClick={() => onClose()} className={navItemClass('/menu')} title="Menu">
                <MenuIcon size={22} />
              </NavLink>
            )}

            {permissions.includes('Billing') && (
              <NavLink to="/billing" onClick={() => onClose()} className={navItemClass('/billing')} title="Billing">
                <Receipt size={22} />
              </NavLink>
            )}

            {permissions.includes('Transactions') && (
              <NavLink to="/transactions" onClick={() => onClose()} className={navItemClass('/transactions')} title="History">
                <History size={22} />
              </NavLink>
            )}

            {permissions.includes('Inventory') && (
              <NavLink to="/inventory" onClick={() => onClose()} className={navItemClass('/inventory')} title="Inventory">
                <Package size={22} />
              </NavLink>
            )}

            {permissions.includes('Reports') && (
              <NavLink to="/reports" onClick={() => onClose()} className={navItemClass('/reports')} title="Reports">
                <PieChart size={22} />
              </NavLink>
            )}
        </nav>

        <div className="mt-auto space-y-4 flex flex-col items-center">
            <NavLink to="/settings" onClick={() => onClose()} className={navItemClass('/settings')} title="Settings">
                <Settings size={22} />
            </NavLink>
            <button 
                onClick={logout}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/40 hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                title="Logout"
            >
                <LogOut size={22} />
            </button>
        </div>
      </div>
    </>
  );
};

const ProtectedLayout = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { currentUser, business } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
      {!isCustomer && (
        <>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          {/* Mobile Header */}
          <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-[60] md:hidden print:hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-slate-600" />
            </button>
            <div className="ml-4 flex items-center gap-3">
              <img src={business.logo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-bold text-slate-900 truncate max-w-[150px]">{business.name}</span>
            </div>
          </div>
        </>
      )}
      <main className={`flex-1 overflow-auto ${!isCustomer ? 'pt-16 md:pt-0' : ''}`}>
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
      <Route path="/:tenantId" element={<TenantLanding />} />
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
