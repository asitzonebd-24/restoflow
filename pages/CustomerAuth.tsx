
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { ArrowRight, Lock, User as UserIcon, Phone, Mail, Utensils, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams, Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export const CustomerAuth = () => {
  const { business, login, addUser, setCurrentUser, setCurrentTenantId } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { tenantId: pathTenantId } = useParams();
  const [searchParams] = useSearchParams();
  const tenantId = pathTenantId || searchParams.get('tenantId');

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
    return () => setCurrentTenantId(null);
  }, [tenantId, setCurrentTenantId]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    address: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const newUser: User = {
          id: `c-${Date.now()}`,
          tenantId: tenantId || '',
          name: formData.name,
          email: formData.email || `${formData.mobile}@customer.com`,
          mobile: formData.mobile,
          password: formData.password,
          address: formData.address,
          role: Role.CUSTOMER,
          permissions: [],
          avatar: ''
        };
        await addUser(newUser);
        
        // Sign in the newly created user
        const success = await login(formData.email || formData.mobile, formData.password, tenantId);
        if (success) {
          navigate(`/${tenantId}/order`);
        } else {
          alert("Registration successful, but auto-login failed. Please log in.");
          setIsRegistering(false);
          setLoading(false);
        }
      } else {
        // Try to login with email or mobile
        const success = await login(formData.email || formData.mobile, formData.password, tenantId);
        if (success) {
          navigate(`/${tenantId}/order`);
        } else {
          alert("Invalid credentials. Please try again or create an account.");
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message === 'Mobile number already exists') {
        toast.error("This mobile number is already registered.");
      } else if (error.message === 'Email already exists') {
        toast.error("This email is already registered.");
      } else {
        toast.error(error.message || "An error occurred during authentication.");
      }
      setLoading(false);
    }
  };

  if (!tenantId) {
    return <Navigate to="/login" replace />;
  }

  if (!business.customerAppEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl">
          <Lock size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
          Portal <br/> <span className="text-rose-600">Disabled</span>
        </h1>
        <p className="text-slate-500 max-w-xs font-medium text-sm mb-8">
          The online ordering portal for <span className="font-black text-slate-900">{business.name}</span> is currently disabled. 
          Please contact the restaurant directly to place your order.
        </p>
        <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Restaurant Contact</p>
          <p className="text-xl font-black text-slate-900">{business.phone || 'N/A'}</p>
        </div>
        <button 
          onClick={() => navigate(`/login?tenantId=${tenantId}`)}
          className="mt-8 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
        >
          Staff Portal Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border-[6px] sm:border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 sm:p-10 text-center">
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-lg overflow-hidden">
              {business.logo ? (
                <img src={business.logo} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" alt="Logo" />
              ) : (
                <Utensils size={32} className="text-indigo-600" />
              )}
           </div>
           <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none">
             {isRegistering ? 'Join the' : 'Welcome to'} <br/> <span className="text-indigo-600">{business.name}</span>
           </h1>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
             {isRegistering ? 'Create your foodie profile' : 'Order fresh food directly to your table'}
           </p>
        </div>

        <div className="px-6 sm:px-10 pb-8 sm:pb-12">
          <form onSubmit={handleAuth} className="space-y-4">
             {isRegistering && (
               <>
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Full Name</label>
                   <div className="relative">
                      <UserIcon className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Alex Doe"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-4 border-black rounded-2xl outline-none focus:bg-white transition-all font-black uppercase text-xs"
                      />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Primary Address / Table</label>
                   <div className="relative">
                      <MapPin className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="e.g. Table 05 or Home Address"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-4 border-black rounded-2xl outline-none focus:bg-white transition-all font-black uppercase text-xs"
                      />
                   </div>
                 </div>
               </>
             )}
             
             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Mobile Number</label>
               <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300" size={18} />
                  <input 
                    type="tel" 
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    placeholder="+1 234 567 890"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border-4 border-black rounded-2xl outline-none focus:bg-white transition-all font-black uppercase text-xs"
                  />
               </div>
             </div>

             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Password</label>
               <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300" size={18} />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border-4 border-black rounded-2xl outline-none focus:bg-white transition-all font-black text-xs"
                  />
               </div>
             </div>

             <button 
               type="submit"
               disabled={loading}
               className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition active:scale-95 text-[11px]"
             >
               {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={18} strokeWidth={3} />
             </button>
          </form>
          
          <div className="mt-8 pt-6 border-t-4 border-dashed border-slate-100 text-center flex flex-col items-center gap-4">
             <button 
               onClick={() => setIsRegistering(!isRegistering)}
               className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition"
             >
               {isRegistering ? 'Already have an account? Sign In' : 'New here? Create an Account'}
             </button>
             <button 
               onClick={() => navigate(`/login?tenantId=${tenantId}`)}
               className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition"
             >
               <Lock size={12} /> Staff Portal
             </button>
             <div className="flex items-center gap-2 opacity-20 grayscale">
                <Utensils size={10} />
                <p className="text-[8px] font-black text-slate-900 uppercase tracking-[0.3em]"> Resto Keep </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};