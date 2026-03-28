
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Role } from '../types';
import { LogIn, ChefHat, Mail, Lock, AlertCircle, Utensils, ArrowRight, User as UserIcon, ShoppingBag } from 'lucide-react';

export const Login = () => {
  const { login, loginWithGoogle, business, dbStatus, setCurrentTenantId, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const success = login(email, password, tenantId);
    if (success) {
      navigate('/');
    } else {
      setStaffError('Access denied. Please check your credentials.');
    }
  };

  const handleGoogleLoginClick = async () => {
    setIsGoogleLoading(true);
    setStaffError('');
    try {
      const success = await loginWithGoogle();
      if (success) {
        navigate('/');
      }
    } catch (error: any) {
      setStaffError(error.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Branding Header */}
        <div className="bg-slate-900 text-white p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl p-2.5 border border-white/10 shadow-lg flex items-center justify-center">
            {tenantId && business.logo ? (
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

        <div className="p-8 md:p-10 flex flex-col flex-1 gap-10">
          {/* Staff Section */}
          <div className="w-full bg-white flex flex-col justify-center">
            <div className="mb-6 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest mb-3">
                 <Lock size={10} /> Staff Terminal
               </div>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                 {tenantId ? 'Staff Login' : 'Super Admin Login'}
               </h2>
               <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                 {tenantId ? 'Access POS & Kitchen' : 'Restricted Access'}
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
            
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email / Mobile</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-xs"
                    placeholder={tenantId ? "staff@restaurant.com" : "admin@portal.com"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-xs"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-slate-200 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
              >
                {isLoading ? 'Connecting...' : 'Enter Terminal'} <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {!tenantId && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[8px] uppercase font-black tracking-widest">
                    <span className="bg-white px-4 text-slate-300">Or Secure Access</span>
                  </div>
                </div>
              )}

              {!tenantId && (
                <button 
                  type="button"
                  onClick={handleGoogleLoginClick}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-white border-2 border-slate-100 hover:border-slate-900 text-slate-900 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group disabled:opacity-50"
                >
                  {isGoogleLoading ? 'Authenticating...' : 'Sign in with Google'}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
              )}
            </form>

            {tenantId && business.customerAppEnabled && (
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-1000">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-500 text-[8px] font-black uppercase tracking-widest">
                    <ShoppingBag size={10} /> Customer Portal
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Are you a Customer?</h3>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Order online & track history</p>
                </div>
                
                <button 
                  onClick={() => navigate(`/${tenantId}/order/auth`)}
                  className="w-full bg-white border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
                >
                  Customer Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {!tenantId && (
              <div className="mt-10 pt-6 border-t border-slate-50">
                 <p className="text-[9px] text-slate-400 text-center leading-relaxed italic">
                   Please use your authorized credentials to access the terminal.
                 </p>
              </div>
            )}
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
