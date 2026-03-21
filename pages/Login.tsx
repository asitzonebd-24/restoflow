
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Role } from '../types';
import { LogIn, ChefHat, Mail, Lock, AlertCircle, Utensils, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login, business, dbStatus, setCurrentTenantId } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
    return () => setCurrentTenantId(null);
  }, [tenantId, setCurrentTenantId]);

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const success = login(email, password, tenantId);
    if (!success) {
      setStaffError('Access denied. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Branding Header */}
        <div className="bg-slate-900 text-white p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl p-2.5 border border-white/10 shadow-lg flex items-center justify-center">
            {tenantId ? (
              <img src={business.logo} className="w-full h-full object-contain rounded-lg" alt="Logo" />
            ) : (
              <ChefHat className="text-white w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              {tenantId ? business.name : 'Super Admin Portal'}
            </h1>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">
              {tenantId ? 'Restaurant Access Terminal' : 'Portal Administrator Access'}
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col flex-1">
          {/* Staff Section */}
          <div className="w-full bg-white flex flex-col justify-center">
            <div className="mb-8 text-center">
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                 {tenantId ? 'Staff Login' : 'Super Admin Login'}
               </h2>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                 {tenantId ? 'Enter credentials to access terminal' : 'Restricted to portal administrators only'}
               </p>
            </div>

            {(!dbStatus.isConfigured || !dbStatus.hasTables) && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex flex-col gap-1 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Demo Mode Active</span>
                </div>
                <p className="text-[9px] font-medium opacity-80 leading-relaxed">
                  {!dbStatus.isConfigured 
                    ? "Firebase is not configured. Changes will not be saved." 
                    : "Database tables are missing. Please check your Firestore setup."}
                </p>
              </div>
            )}

            {staffError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-[9px] font-bold uppercase animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                {staffError}
              </div>
            )}
            
            <form onSubmit={handleStaffSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-sm"
                    placeholder={tenantId ? "staff@bistro.com" : "admin@portal.com"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-200 flex items-center justify-center gap-3 uppercase text-xs tracking-widest group mt-2"
              >
                Enter Terminal <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-50">
               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center mb-3">Demo Credentials</p>
               <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Super Admin (Portal)</p>
                    <p className="text-[10px] font-medium text-slate-600">
                      <span className="text-slate-900 font-bold">admin@portal.com</span> / <span className="text-slate-900 font-bold">admin</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Business Owner (Bistro)</p>
                    <p className="text-[10px] font-medium text-slate-600">
                      <span className="text-slate-900 font-bold">owner@bistro.com</span> / <span className="text-slate-900 font-bold">password</span>
                    </p>
                  </div>
               </div>
               {!tenantId && (
                 <p className="mt-4 text-[9px] text-slate-400 text-center leading-relaxed">
                   Business owners can log in here or via their <span className="text-indigo-500 font-bold">Tenant-Specific Link</span>.
                 </p>
               )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Back to Landing - Only show if tenantId is present */}
      {tenantId && (
        <button 
          onClick={() => navigate(`/${tenantId}`)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2"
        >
          <ArrowRight size={14} className="rotate-180" /> Back to Restaurant
        </button>
      )}
    </div>
  );
};
