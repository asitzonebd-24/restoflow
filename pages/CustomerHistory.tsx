
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { ShoppingBag, Timer, Clock, Menu as MenuIcon, User as UserCircle, ShoppingCart, LogOut, X, MapPin, History, ChevronRight, Store, Utensils } from 'lucide-react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerHistory = () => {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const { orders, currentUser, business, logout, setCurrentTenantId, activeCategory, setActiveCategory, categories } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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

  if (!business.customerAppEnabled) {
    return <Navigate to={`/${tenantId}/order/auth`} replace />;
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`fixed md:relative h-full w-64 text-white z-[160] border-r-4 border-indigo-500/20 flex-col items-stretch py-8 shrink-0 shadow-2xl shadow-indigo-500/10 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #1d1d3f 0%, #11112b 100%)' }}
      >
        <div className="flex items-center justify-between px-6 mb-12">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border-2 border-white bg-white/10 flex items-center justify-center overflow-hidden">
               {business.logo ? (
                 <img src={business.logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <Utensils size={16} className="text-white/40" />
               )}
             </div>
             <h2 className="font-black text-lg uppercase tracking-tighter">Resto Keep</h2>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">
             <X size={24} />
           </button>
        </div>
        <nav className="flex-1 space-y-2 px-6 overflow-y-auto no-scrollbar">
           <button onClick={() => { navigate(`/${tenantId}/order`); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <ShoppingBag size={20} /> <span>Digital Menu</span>
           </button>
           <button onClick={() => { navigate(`/${tenantId}/order/panel`); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order/panel`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <Timer size={20} /> <span>My Tokens</span>
           </button>
           <button onClick={() => { navigate(`/${tenantId}/order/history`); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive(`/${tenantId}/order/history`) ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <History size={20} /> <span>History</span>
           </button>

           <div className="pt-6 mt-6 border-t border-white/10">
             <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] mb-4 px-2">Categories</p>
             <div className="space-y-1">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => {
                     setActiveCategory(cat);
                     setIsSidebarOpen(false);
                     if (!isActive(`/${tenantId}/order`)) navigate(`/${tenantId}/order`);
                   }}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold uppercase tracking-widest text-[9px] ${
                     activeCategory === cat ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'
                   }`}
                 >
                   <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === cat ? 'bg-white' : 'bg-white/20'}`} />
                   {cat}
                 </button>
               ))}
             </div>
           </div>
        </nav>
        <div className="pt-8 border-t border-white/10 mt-auto px-8 flex flex-col items-start">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-white/10 flex items-center justify-center overflow-hidden">
               {currentUser?.avatar ? (
                 <img src={currentUser.avatar} className="w-full h-full object-cover" alt="avatar" />
               ) : (
                 <UserCircle size={20} className="text-white" />
               )}
             </div>
             <div className="min-w-0">
               <p className="text-[10px] font-black uppercase truncate">{currentUser?.name}</p>
               <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Customer</p>
             </div>
           </div>
           <button 
             onClick={() => {
               const tId = tenantId;
               logout();
               if (tId) navigate(`/${tId}`);
               else navigate('/login');
             }} 
             className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition font-black uppercase tracking-widest text-[10px]"
           >
             <LogOut size={20} /> <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b-4 border-indigo-500 p-4 flex justify-between items-center shadow-xl shadow-indigo-100 shrink-0">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600"
             >
               <MenuIcon size={20} />
             </button>
             <h1 className="text-xl font-black uppercase tracking-tighter">Order Vault</h1>
           </div>
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
                                <div className="flex flex-col">
                                  <div className="max-w-[200px] truncate font-black uppercase text-[10px] text-slate-900 tracking-tight">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                  </div>
                                  {order.deliveryStaffName && (
                                    <div className="mt-2 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <ShoppingBag size={10} className="text-indigo-500" />
                                        <span className="text-[7px] font-black uppercase tracking-widest text-indigo-500">Assigned Delivery</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-slate-900 leading-none">{order.deliveryStaffName}</p>
                                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">{order.deliveryStaffMobile}</p>
                                      </div>
                                    </div>
                                  )}
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
              className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-lg md:rounded-[3rem] rounded-t-[2rem] border-4 border-indigo-500 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] self-end md:self-center"
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
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Subtotal</span>
                      <span className="text-lg font-black text-slate-600 tracking-tighter">{business.currency}{(selectedOrder.totalAmount + (selectedOrder.discount || 0)).toFixed(0)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-black uppercase text-[10px] text-rose-400 tracking-widest">Discount</span>
                        <span className="text-lg font-black text-rose-500 tracking-tighter">-{business.currency}{selectedOrder.discount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-black uppercase text-[10px] text-slate-900 tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">{business.currency}{selectedOrder.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border-2 border-slate-100">
                      <MapPin size={14} className="text-indigo-500 shrink-0" />
                      <p className="text-[10px] font-black uppercase text-slate-600 truncate">{selectedOrder.deliveryAddress || 'No address provided'}</p>
                    </div>
                    {selectedOrder.deliveryStaffName && (
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={14} className="text-indigo-500 shrink-0" />
                          <div>
                            <p className="text-[8px] font-black uppercase text-indigo-400 leading-none mb-1">Assigned Delivery</p>
                            <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{selectedOrder.deliveryStaffName}</p>
                          </div>
                        </div>
                        {selectedOrder.deliveryStaffMobile && (
                          <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-600">{selectedOrder.deliveryStaffMobile}</p>
                          </div>
                        )}
                      </div>
                    )}
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
