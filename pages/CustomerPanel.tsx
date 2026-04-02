
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { Timer, ShoppingBag, X, MapPin, ChevronRight, Menu as MenuIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Navigate } from 'react-router-dom';

export const CustomerPanel = ({ setIsSidebarOpen }: { setIsSidebarOpen?: (open: boolean) => void }) => {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const { orders, currentUser, business, setCurrentTenantId } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const navigate = useNavigate();

  const tenantId = urlTenantId || currentUser?.tenantId;

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => o.createdBy === currentUser.id)
                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentUser]);

  const activeOrders = myOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
  const completedOrders = myOrders.filter(o => o.status === OrderStatus.COMPLETED).slice(0, 5);

  const getStatusDisplay = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { label: 'Online Order', color: 'bg-pink-500', border: 'border-t-pink-500', lightBg: 'bg-pink-50', text: 'text-pink-600', borderLight: 'border-pink-200' };
      case OrderStatus.PREPARING: 
        return { label: 'Ready', color: 'bg-blue-500', border: 'border-t-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-600', borderLight: 'border-blue-200' };
      case OrderStatus.READY: 
        return { label: 'Done!', color: 'bg-emerald-500', border: 'border-t-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-600', borderLight: 'border-emerald-200' };
      case OrderStatus.CANCELLED:
        return { label: 'Cancelled', color: 'bg-red-500', border: 'border-t-red-500', lightBg: 'bg-red-50', text: 'text-red-600', borderLight: 'border-red-200' };
      default: 
        return { label: status, color: 'bg-slate-500', border: 'border-t-slate-500', lightBg: 'bg-slate-50', text: 'text-slate-600', borderLight: 'border-slate-200' };
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!business.customerAppEnabled) {
    return <Navigate to={`/${tenantId}/order/auth`} replace />;
  }

  const StatusBox = ({ label, count, colorClass, activeColor }: { label: string, count: number, colorClass: string, activeColor: string }) => (
    <div className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border-2 transition-all ${count > 0 ? activeColor : colorClass}`}>
      <span className="text-[7px] font-black uppercase tracking-widest opacity-80 mb-0.5">{label}</span>
      <span className="text-sm font-black leading-none">{count}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">

      {/* Mobile Sidebar Overlay */}



      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b-4 border-indigo-500 p-4 flex justify-between items-center shadow-xl shadow-indigo-100 shrink-0">
           <div className="flex items-center gap-4">
             {setIsSidebarOpen && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600"
               >
                 <MenuIcon size={20} />
               </button>
             )}
             <h1 className="text-xl font-black uppercase tracking-tighter">Active Tokens</h1>
           </div>
           <div className="flex items-center gap-3">
              <Timer className="text-indigo-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tracking: {activeOrders.length}</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 pb-12">
                 {activeOrders.length === 0 ? (
                   <div className="col-span-full py-20 px-6 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
                      <ShoppingBag size={48} className="mx-auto text-slate-100 mb-6" />
                      <h3 className="text-slate-300 font-black uppercase text-xl tracking-[0.2em]">No Active Tokens</h3>
                      <button onClick={() => navigate(`/${tenantId}/order`)} className="bg-black text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition shadow-xl border-4 border-white mt-8">Digital Menu</button>
                   </div>
                 ) : activeOrders.map(order => {
                    const pendingCount = order.items.filter(i => i.status === OrderStatus.PENDING).reduce((acc, i) => acc + i.quantity, 0);
                    const preparingCount = order.items.filter(i => i.status === OrderStatus.PREPARING).reduce((acc, i) => acc + i.quantity, 0);
                    const readyCount = order.items.filter(i => i.status === OrderStatus.READY).reduce((acc, i) => acc + i.quantity, 0);
                    
                    const hasPending = order.items.some(i => i.status === OrderStatus.PENDING);
                    const hasPreparing = order.items.some(i => i.status === OrderStatus.PREPARING);
                    
                    const derivedStatus = hasPending 
                      ? OrderStatus.PENDING 
                      : (hasPreparing ? OrderStatus.PREPARING : order.status);
                      
                    const status = getStatusDisplay(derivedStatus);
                    
                    // Fixed labeling to avoid hardcoded placeholders
                    const prefix = business.customerTokenPrefix || 'WEB';
                    const headerLabel = order.tokenNumber.startsWith(prefix) ? 'Online Order' : 'Store Token';

                    return (
                        <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`group relative bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 shadow-xl border-t-8 border-x-4 border-b-4 transition-all duration-300 transform hover:-translate-y-2 text-left w-full ${
                                order.status === OrderStatus.PENDING ? 'border-pink-500 shadow-pink-100' :
                                order.status === OrderStatus.PREPARING ? 'border-blue-500 shadow-blue-100' :
                                'border-emerald-500 shadow-emerald-100'
                            }`}
                        >
                            <div className="w-full">
                                <div className="flex flex-col items-center">
                                    <div className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-1">{headerLabel}</div>
                                    <div className={`h-1.5 w-12 ${status.color} rounded-full`}></div>
                                </div>

                                <div className="flex justify-center items-center my-4">
                                    <div className={`w-fit min-w-[3rem] px-4 h-12 rounded-full border-4 border-black flex items-center justify-center font-black text-2xl text-white shadow-xl ${status.color}`}>
                                        <span className="text-white text-xl md:text-2xl font-black leading-none">{order.tokenNumber}</span>
                                    </div>
                                </div>

                                {order.deliveryStaffName && (
                                    <div className="mb-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShoppingBag size={14} className="text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Assigned Delivery</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-black text-slate-900 leading-none">{order.deliveryStaffName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 leading-none">{order.deliveryStaffMobile}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full">
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <StatusBox label="Pending" count={pendingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-pink-50 border-pink-200 text-pink-600 shadow-sm" />
                                    <StatusBox label="Ready" count={preparingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-blue-50 border-blue-200 text-blue-600 shadow-sm" />
                                    <StatusBox label="Done" count={readyCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" />
                                </div>

                                {/* Ready Items List */}
                                {preparingCount > 0 && (
                                    <div className="mb-4 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                                        {order.items.filter((i: any) => i.status === OrderStatus.PREPARING).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px] font-black text-amber-600 uppercase tracking-tight bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                                <span className="truncate pr-2">{item.name}</span>
                                                <span className="shrink-0">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t-2 border-slate-200 border-dashed flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-slate-300" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-md border-2 border-indigo-500">
                                          {business.currency}{order.totalAmount.toFixed(0)}
                                      </div>
                                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                   );
                 })}
            </div>

            {/* Recent History Summary */}
            {completedOrders.length > 0 && (
              <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <History size={24} className="text-indigo-600" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Recent Completed Orders</h2>
                  </div>
                  <button 
                    onClick={() => navigate(`/${tenantId}/order/history`)}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                  >
                    View All History <ChevronRight size={14} />
                  </button>
                </div>
                
                <div className="bg-white rounded-[2.5rem] border-4 border-slate-100 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b-4 border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-50">
                        {completedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="font-black text-lg text-slate-900 tracking-tighter">#{order.tokenNumber}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-600 uppercase">
                                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className="text-sm font-black text-slate-900">
                                {business.currency}{order.totalAmount.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
                      <h2 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">Order Details</h2>
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
