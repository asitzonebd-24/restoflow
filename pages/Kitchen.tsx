
import React from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, ItemStatus, Role } from '../types';
import { Clock, CheckCircle, Flame, Timer, PlayCircle, CheckSquare, FileText, Lock, Hash, User as UserIcon } from 'lucide-react';

export const Kitchen = () => {
  const { orders, updateOrderStatus, updateOrderItemStatus, currentTenant, currentUser, users } = useApp();

  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);

  const getStatusColors = (status: OrderStatus | ItemStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { border: 'border-t-red-500', bg: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-700', borderLight: 'border-red-200' };
      case OrderStatus.PREPARING: 
        return { border: 'border-t-yellow-500', bg: 'bg-yellow-500', lightBg: 'bg-yellow-50', text: 'text-yellow-700', borderLight: 'border-yellow-200' };
      case OrderStatus.READY: 
        return { border: 'border-t-green-500', bg: 'bg-green-500', lightBg: 'bg-green-50', text: 'text-green-700', borderLight: 'border-green-200' };
      default: 
        return { border: 'border-t-slate-900', bg: 'bg-slate-900', lightBg: 'bg-gray-50', text: 'text-gray-500', borderLight: 'border-gray-200' };
    }
  };

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === OrderStatus.PENDING) return OrderStatus.PREPARING;
    if (current === OrderStatus.PREPARING) return OrderStatus.READY;
    return null;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canMoveToReady = (userRole: Role) => {
    return [Role.OWNER, Role.MANAGER, Role.WAITER].includes(userRole);
  };

  const getCreatorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  return (
    <div className="p-4 h-[calc(100vh-64px)] overflow-y-auto bg-gray-100">
      <div className="mb-6 flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <Flame className="text-orange-500" size={32} /> LIVE KITCHEN
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Real-time token monitoring</p>
        </div>
        <div className="flex gap-2">
           <span className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 shadow-sm">
             Current Active: {activeOrders.length}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {activeOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-96 bg-white rounded-[2rem] shadow-sm border-2 border-dashed border-gray-200">
                <CheckCircle size={64} className="text-gray-100 mb-4" />
                <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">KITCHEN CLEAR</h3>
            </div>
        ) : activeOrders.map(order => {
          const targetStatus = nextStatus(order.status);
          const isAllowedToUpdate = targetStatus === OrderStatus.READY ? canMoveToReady(currentUser!.role) : true;
          const creatorName = getCreatorName(order.createdBy);
          const statusColors = getStatusColors(order.status);
          const headerLabel = order.tokenNumber.startsWith(currentTenant.customerTokenPrefix) ? 'Online Order' : 'Token View';
          
          return (
          <div key={order.id} className={`group relative rounded-[2rem] border-t-8 shadow-lg p-4 bg-white flex flex-col h-full transition-all hover:shadow-2xl ${statusColors.border} border-x-2 border-b-2 border-slate-900 min-h-[300px]`}>
            
            <div className="flex justify-between items-start mb-0.5 border-b border-gray-50 pb-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-1.5 mb-0.5">
                   <Hash size={10} strokeWidth={3} /> {headerLabel}
                </span>
                <div className={`h-1 w-8 ${statusColors.bg} rounded-full mt-0.5`}></div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
                  <Clock size={12} strokeWidth={3} />
                  {formatTime(order.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex justify-center my-0.5 gap-2 items-center">
              <div className={`px-4 py-1 ${statusColors.bg} border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-white text-base font-black">{order.tokenNumber}</span>
              </div>
              {order.tableNumber && (
                <div className="bg-slate-100 border-2 border-slate-900 px-3 py-1 rounded-xl shadow-sm">
                  <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">T: {order.tableNumber}</span>
                </div>
              )}
            </div>

            {order.note && (
                <div className="bg-amber-50 p-2 rounded-xl mb-3 text-[9px] text-amber-800 border-2 border-amber-100 flex gap-2 shadow-inner">
                    <FileText size={12} className="shrink-0 text-amber-500"/>
                    <span className="font-bold italic leading-tight uppercase tracking-tight line-clamp-2">{order.note}</span>
                </div>
            )}

            <div className="flex-1 space-y-1 mb-2 overflow-y-auto no-scrollbar">
              {order.items.map((item) => {
                 const itemStatusColors = getStatusColors(item.status || OrderStatus.PENDING);
                 return (
                  <div key={item.rowId} className="flex items-center gap-2 p-2 rounded-2xl bg-gray-50 border border-gray-100 transition hover:bg-white hover:border-indigo-100 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <span className="text-sm font-black text-indigo-600 shrink-0">{item.quantity}x</span>
                        <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-tight leading-tight break-words pt-0.5">
                          {item.name}
                        </h4>
                      </div>
                    </div>
                    
                    <select 
                        value={item.status || OrderStatus.PENDING}
                        onChange={(e) => updateOrderItemStatus(order.id, item.rowId, e.target.value as ItemStatus)}
                        className={`text-[8px] font-black uppercase py-1 px-1.5 rounded-lg border outline-none cursor-pointer transition-colors shadow-sm shrink-0 ${itemStatusColors.lightBg} ${itemStatusColors.borderLight} ${itemStatusColors.text}`}
                    >
                        <option value={OrderStatus.PENDING}>New</option>
                        <option value={OrderStatus.PREPARING}>Fire</option>
                        <option value={OrderStatus.READY}>Done</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-2 border-t border-gray-100">
               <div className="flex items-center gap-1.5 mb-1.5">
                  <UserIcon size={10} className="text-gray-400" strokeWidth={3} />
                  <span className="text-[9px] font-black text-gray-500 uppercase">{creatorName}</span>
               </div>
               {order.status !== OrderStatus.READY ? (
                 isAllowedToUpdate ? (
                    <button 
                      onClick={() => updateOrderStatus(order.id, targetStatus!)}
                      className="w-full py-2.5 rounded-xl font-black text-white transition transform active:scale-95 hover:brightness-110 shadow-lg text-[9px] uppercase tracking-widest"
                      style={{ backgroundColor: currentTenant?.themeColor }}
                    >
                      BUMP {targetStatus}
                    </button>
                 ) : (
                    <div className="text-center text-[8px] font-black uppercase tracking-widest text-gray-400 py-2.5 border border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-1.5 bg-gray-50/50">
                        <Lock size={10} /> WAITER NEEDED
                    </div>
                 )
               ) : (
                 <div className="text-center text-emerald-600 font-black py-2.5 bg-emerald-50 rounded-xl animate-pulse uppercase tracking-[0.2em] text-[9px] border border-emerald-100">
                   READY TO GO
                 </div>
               )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
