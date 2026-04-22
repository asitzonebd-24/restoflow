
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, User, ArrowRight, Store, Globe, MapPin, Phone, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Role } from '../types';

export const TenantLanding = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { tenants, setCurrentTenantId, isLoading, currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [showNotFound, setShowNotFound] = useState(false);

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
      
      // Auto-logout if user is logged into a different restaurant
      // OR Auto-redirect to dashboard if already logged into this restaurant
      if (currentUser && currentUser.role !== Role.SUPER_ADMIN) {
        const targetTenant = tenants.find(t => t.id === tenantId || t.slug === tenantId);
        const targetId = targetTenant?.id || tenantId;
        
        if (targetId !== currentUser.tenantId) {
          console.log('[TenantLanding] Tenant mismatch. Logging out previous session.', {
            urlTenant: tenantId,
            targetId,
            currentUserTenant: currentUser.tenantId
          });
          logout();
        } else {
          // User is already logged into this tenant! 
          // If they have Dashboard or POS permission, redirect them automatically
          const permissions = currentUser.permissions || [];
          if (permissions.includes('Dashboard')) {
            console.log('[TenantLanding] User already logged in to this tenant. Redirecting to Dashboard.');
            navigate(`/${targetId}/dashboard`, { replace: true });
          } else if (permissions.includes('POS')) {
            console.log('[TenantLanding] User already logged in to this tenant. Redirecting to POS.');
            navigate(`/${targetId}/pos`, { replace: true });
          }
        }
      }
    }
  }, [tenantId, setCurrentTenantId, currentUser, logout, tenants, navigate]);

  const tenant = tenants.find(t => t.id === tenantId || t.slug === tenantId);
  const actualTenantId = tenant?.id || tenantId;

  useEffect(() => {
    console.log('[TenantLanding] Params tenantId:', tenantId);
    console.log('[TenantLanding] Resolved tenant:', tenant?.name);
    console.log('[TenantLanding] actualTenantId for navigation:', actualTenantId);
  }, [tenantId, tenant, actualTenantId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isLoading && !tenant) {
      // Delay showing "Not Found" to allow Firestore to catch up with the new tenantId query
      timer = setTimeout(() => setShowNotFound(true), 1500);
    } else {
      setShowNotFound(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, tenant]);

  if (isLoading || (!tenant && !showNotFound)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Business Portal...</p>
      </div>
    );
  }

  if (!tenant && showNotFound) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
          <Utensils size={32} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8">
          The business with ID <span className="font-bold text-slate-900">"{tenantId}"</span> could not be found. 
          It may have been deleted or the link might be incorrect.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (tenant.isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-amber-500 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-8 border-4 border-amber-100 shadow-inner">
              <AlertTriangle size={48} className="text-amber-600" />
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
              Under <span className="text-amber-600">Maintenance</span>
            </h2>
            
            <div className="w-12 h-1.5 bg-amber-500 rounded-full mb-8" />
            
            <p className="text-slate-600 font-bold text-lg leading-relaxed mb-8">
              {tenant.maintenanceMessage || "We are currently performing some updates to improve your experience. We'll be back online very soon!"}
            </p>
            
            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 w-full">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Estimated Time</p>
              <p className="text-xl font-black text-slate-900 uppercase">Coming Back Soon</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="mt-8 text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"
        >
          <ArrowRight size={14} className="rotate-180" /> Back to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding & Info */}
        <div className="space-y-8 text-center md:text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm">
            <Store size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Official Restaurant Portal</span>
          </div>
          
          <div className="space-y-4">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl p-4 border border-slate-100 mx-auto md:mx-0 flex items-center justify-center overflow-hidden">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Utensils size={40} className="text-indigo-600" />
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-none tracking-tighter uppercase">
              {tenant.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <MapPin size={14} className="text-indigo-500" /> {tenant.address || 'Global Presence'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <Phone size={14} className="text-indigo-500" /> {tenant.phone || 'Contact Support'}
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
            Welcome to our unified digital ecosystem. Choose your portal below to continue with your personalized experience.
          </p>
        </div>

        {/* Right Side: Portal Selection */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          {/* Staff Portal */}
          <Link 
            to={`/login?tenantId=${actualTenantId}`}
            className="w-full group bg-slate-900 hover:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border-4 border-white/10 group-hover:bg-white/20 transition-colors">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Staff Terminal</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Manage orders & inventory</p>
              </div>
            </div>
            <ArrowRight size={24} className="text-white/20 group-hover:text-white transition-colors" />
          </Link>

          {/* Customer Portal */}
          {tenant.customerAppEnabled && (
            <Link 
              to={`/${actualTenantId}/order/auth`}
              className="w-full group bg-white hover:bg-slate-50 p-8 rounded-[2.5rem] border-4 border-slate-200 shadow-[8px_8px_0px_0px_rgba(226,232,240,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border-4 border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                  <ShoppingBag size={32} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Customer Portal</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order online & track history</p>
                </div>
              </div>
              <ArrowRight size={24} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 opacity-20 grayscale">
          <Utensils size={12} />
          <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em]"> Resto Keep Ecosystem </p>
        </div>
      </div>
    </div>
  );
};
