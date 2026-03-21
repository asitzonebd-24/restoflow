
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { ShoppingBag, Timer, Clock, Menu as MenuIcon, User as UserCircle, ShoppingCart, LogOut, X, MapPin, History, ChevronRight, Store } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerHistory = () => {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const { orders, currentUser, business, logout, setCurrentTenantId } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const tenantId = urlTenantId || currentUser?.tenantId;

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

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
        className="flex h-full w-16 md:w-64 text-white z-[110] border-r-4 border-indigo-500/20 flex-col items-center md:items-stretch py-8 shrink-0 shadow-2xl shadow-indigo-500/10"
        style={{ background: 'linear-gradient(180deg, #1d1d3f 0%, #11112b 100%)' }}
      >
        <div className="flex items-center gap-3 px-4 md:px-8 mb-12">
           {business.logo ? (
             <img src={business.logo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white" />
           ) : (
             <div className="w-10 h-10 rounded-full border-2 border-white bg-white/10 flex items-center justify-center">
               <Store size={16} className="text-white" />
             </div>
           )}
           <h2 className="hidden md:block font-black text-lg uppercase tracking-tighter">Resto Keep</h2>
        </div>
        <nav className="flex-1 space-y-4 px-2 md:px-6">
           <button 
             onClick={() => navigate(`/${tenantId}/order`)}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="Menu"
           >
             <ShoppingBag size={20} /> <span className="hidden md:block">Digital Menu</span>
           </button>
           <button 
             onClick={() => navigate(`/${tenantId}/order/panel`)}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order/panel`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="Tokens"
           >
             <Timer size={20} /> <span className="hidden md:block">My Tokens</span>
           </button>
           <button 
             onClick={() => navigate(`/${tenantId}/order/history`)}
             className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order/history`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}
             title="History"
           >
             <History size={20} /> <span className="hidden md:block">History</span>
           </button>
        </nav>
        <div className="pt-8 border-t border-white/10 mt-auto px-2 md:px-8 flex flex-col items-center md:items-start">
           {currentUser?.avatar ? (
             <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500 mb-4" alt="avatar" />
           ) : (
             <div className="w-10 h-10 rounded-full border-2 border-indigo-500 mb-4 bg-white/10 flex items-center justify-center">
               <UserCircle size={20} className="text-white" />
             </div>
           )}
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
                          <tr 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-slate-50 transition group cursor-pointer"
                          >
                             <td className="p-6">
                                <div className="min-w-[2.5rem] px-3 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black border-2 border-white shadow-lg shadow-indigo-200">
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
                                <div className="flex items-center justify-end gap-3">
                                  <span className="font-black text-indigo-600 text-sm">{business.currency}{order.totalAmount.toFixed(0)}</span>
                                  <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[3rem] border-4 border-indigo-500 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b-4 border-indigo-500 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[3rem] px-4 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl border-2 border-white shadow-lg">
                      {selectedOrder.tokenNumber}
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">Order Summary</h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-[1.5rem] border-2 border-slate-100 flex justify-between items-center shadow-sm">
                      <div className="min-w-0 pr-4">
                        <h4 className="font-black text-[11px] uppercase truncate">{item.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{business.currency}{item.price.toFixed(0)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-xs">x{item.quantity}</span>
                        <span className="font-black text-indigo-600 text-sm">{business.currency}{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t-4 border-slate-100 bg-slate-50 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Grand Total</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{business.currency}{selectedOrder.totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border-2 border-slate-100">
                    <MapPin size={14} className="text-indigo-500" />
                    <p className="text-[10px] font-black uppercase text-slate-600 truncate">{selectedOrder.deliveryAddress || 'No address provided'}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
