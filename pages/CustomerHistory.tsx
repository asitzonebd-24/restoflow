
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { ShoppingBag, Timer, Clock, Menu as MenuIcon, User as UserCircle, ShoppingCart, LogOut, X, MapPin, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const CustomerHistory = () => {
  const { orders, currentUser, business, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const pastOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => o.createdBy === currentUser.id && o.status === OrderStatus.COMPLETED)
                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentUser]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar - Fixed Rail */}
      <aside 
        className="h-full w-20 md:w-64 text-white z-[110] border-r-8 border-indigo-500/20 flex flex-col items-center md:items-stretch py-8 shrink-0 shadow-2xl shadow-indigo-500/10"
        style={{ background: 'linear-gradient(180deg, #1d1d3f 0%, #11112b 100%)' }}
      >
        <div className="flex items-center gap-3 px-4 md:px-8 mb-12">
           <img src={business.logo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white" />
           <h2 className="hidden md:block font-black text-lg uppercase tracking-tighter">OmniDine</h2>
        </div>
        <nav className="flex-1 space-y-4 px-2 md:px-6">
           <button 
             onClick={() => navigate('/order')}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="Menu"
           >
             <ShoppingBag size={20} /> <span className="hidden md:block">Digital Menu</span>
           </button>
           <button 
             onClick={() => navigate('/order/panel')}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order/panel') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="Tokens"
           >
             <Timer size={20} /> <span className="hidden md:block">My Tokens</span>
           </button>
           <button 
             onClick={() => navigate('/order/history')}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order/history') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="History"
           >
             <History size={20} /> <span className="hidden md:block">History</span>
           </button>
        </nav>
        <div className="pt-8 border-t border-white/10 mt-auto px-2 md:px-8 flex flex-col items-center md:items-start">
           <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500 mb-4" alt="avatar" />
           <div className="hidden md:block min-w-0 mb-8">
              <p className="font-black uppercase text-xs truncate">{currentUser?.name}</p>
              <p className="text-[9px] font-bold text-white/40 uppercase truncate">{currentUser?.mobile}</p>
           </div>
           <button onClick={logout} className="p-4 md:w-full md:flex md:items-center md:gap-4 md:px-6 md:py-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition font-black uppercase tracking-widest text-[10px]" title="Logout">
             <LogOut size={20} /> <span className="hidden md:block">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b-4 border-indigo-500 p-4 flex justify-between items-center shadow-xl shadow-indigo-100 shrink-0">
           <h1 className="text-xl font-black uppercase tracking-tighter">Order Vault</h1>
           <History className="text-slate-200" size={24} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[2.5rem] border-4 border-indigo-500 overflow-hidden shadow-2xl shadow-indigo-100">
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                     <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b-4 border-indigo-500">
                        <tr>
                           <th className="p-6">Token</th>
                           <th className="p-6">Menu Items</th>
                           <th className="p-6">Timestamp</th>
                           <th className="p-6 text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y-2 divide-slate-100">
                        {pastOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-20 text-center">
                               <ShoppingBag className="mx-auto text-slate-100 mb-4" size={48} />
                               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No completed transactions found</p>
                            </td>
                          </tr>
                        ) : pastOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50 transition group">
                             <td className="p-6">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black border-2 border-white shadow-lg shadow-indigo-200">
                                  #{order.tokenNumber}
                                </div>
                             </td>
                             <td className="p-6">
                                <div className="max-w-[200px] truncate font-black uppercase text-[10px] text-slate-900 tracking-tight">
                                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                             </td>
                             <td className="p-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</div>
                                <div className="text-[8px] font-bold text-slate-300 uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                             </td>
                             <td className="p-6 text-right">
                                <span className="font-black text-indigo-600 text-sm">{business.currency}{order.totalAmount.toFixed(0)}</span>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
