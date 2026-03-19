
import React from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, ItemStatus, Role } from '../types';
import { Clock, CheckCircle, Flame, Timer, PlayCircle, CheckSquare, FileText, Lock, Hash, User as UserIcon, ChevronDown } from 'lucide-react';

export const Kitchen = () => {
  const { orders, updateOrderStatus, updateOrderItemStatus, currentTenant, currentUser, users } = useApp();

  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);

  const getStatusColors = (status: OrderStatus | ItemStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { 
          border: 'border-red-100', 
          bg: 'bg-red-500', 
          lightBg: 'bg-red-50', 
          text: 'text-red-600', 
          borderLight: 'border-red-200', 
          icon: 'text-red-500',
          cardBorder: 'border-rose-500',
          cardShadow: 'shadow-rose-100'
        };
      case OrderStatus.PREPARING: 
        return { 
          border: 'border-amber-100', 
          bg: 'bg-amber-500', 
          lightBg: 'bg-amber-50', 
          text: 'text-amber-600', 
          borderLight: 'border-amber-200', 
          icon: 'text-amber-500',
          cardBorder: 'border-amber-500',
          cardShadow: 'shadow-amber-100'
        };
      case OrderStatus.READY: 
        return { 
          border: 'border-emerald-100', 
          bg: 'bg-emerald-500', 
          lightBg: 'bg-emerald-50', 
          text: 'text-emerald-600', 
          borderLight: 'border-emerald-200', 
          icon: 'text-emerald-500',
          cardBorder: 'border-emerald-500',
          cardShadow: 'shadow-emerald-100'
        };
      default: 
        return { 
          border: 'border-slate-100', 
          bg: 'bg-slate-900', 
          lightBg: 'bg-slate-50', 
          text: 'text-slate-600', 
          borderLight: 'border-slate-200', 
          icon: 'text-slate-500',
          cardBorder: 'border-slate-200',
          cardShadow: 'shadow-slate-100'
        };
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
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
             <Flame className="text-orange-500" size={32} /> Kitchen Terminal
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Real-time order monitoring & preparation tracking</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white border-2 border-indigo-500 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 shadow-lg shadow-indigo-100 flex items-center gap-3 transition-all hover:scale-105">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Active Tokens: {activeOrders.length}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {activeOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-96 bg-white rounded-[2.5rem] shadow-xl border-2 border-dashed border-slate-200">
                <CheckCircle size={64} strokeWidth={1} className="text-slate-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Kitchen Clear</h3>
                <p className="text-sm text-slate-400 mt-2">All orders have been prepared and served.</p>
            </div>
        ) : activeOrders.map(order => {
          const targetStatus = nextStatus(order.status);
          const isAllowedToUpdate = targetStatus === OrderStatus.READY ? canMoveToReady(currentUser!.role) : true;
          const creatorName = getCreatorName(order.createdBy);
          const statusColors = getStatusColors(order.status);
          const headerLabel = order.tokenNumber.startsWith(currentTenant.customerTokenPrefix) ? 'Online Order' : 'Service Token';
          
          return (
          <div key={order.id} className={`group relative rounded-[2.5rem] shadow-xl p-8 bg-white flex flex-col h-full transition-all hover:shadow-2xl border-2 ${statusColors.cardBorder} ${statusColors.cardShadow} min-h-[400px]`}>
            
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                   <Hash size={12} /> {headerLabel}
                </span>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors.lightBg} ${statusColors.text} border ${statusColors.borderLight} inline-block`}>
                  {order.status}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock size={12} />
                  {formatTime(order.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <div className={`w-20 h-20 rounded-3xl ${statusColors.lightBg} flex items-center justify-center font-bold text-4xl ${statusColors.text} border ${statusColors.borderLight} shadow-inner`}>
                {order.tokenNumber}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-2xl tracking-tight">Table {order.tableNumber || 'N/A'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">#{order.id.slice(-4)}</p>
              </div>
            </div>

            {order.note && (
                <div className="bg-amber-50/50 p-5 rounded-2xl mb-8 text-xs text-amber-800 border border-amber-100/50 flex gap-4 shadow-sm italic">
                    <FileText size={18} className="shrink-0 text-amber-500/70"/>
                    <span className="font-medium leading-relaxed opacity-80">"{order.note}"</span>
                </div>
            )}

            <div className="flex-1 space-y-4 mb-8 overflow-y-auto no-scrollbar">
              {order.items.map((item) => {
                 const itemStatusColors = getStatusColors(item.status || OrderStatus.PENDING);
                 return (
                  <div key={item.rowId} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:border-indigo-100 shadow-sm group/item">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-slate-900 shrink-0 bg-white w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">{item.quantity}</span>
                        <h4 className={`text-sm font-bold uppercase tracking-tight leading-tight break-words pt-1.5 ${item.status === OrderStatus.READY ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                          {item.name}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="relative shrink-0">
                        <select 
                            value={item.status || OrderStatus.PENDING}
                            onChange={(e) => updateOrderItemStatus(order.id, item.rowId, e.target.value as ItemStatus)}
                            className={`text-[10px] font-bold uppercase py-2 px-3 rounded-xl border outline-none cursor-pointer transition-all shadow-sm appearance-none pr-8 ${itemStatusColors.lightBg} ${itemStatusColors.borderLight} ${itemStatusColors.text}`}
                        >
                            <option value={OrderStatus.PENDING}>New</option>
                            <option value={OrderStatus.PREPARING}>Fire</option>
                            <option value={OrderStatus.READY}>Done</option>
                        </select>
                        <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${itemStatusColors.text}`} size={12} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-8 border-t border-slate-50 flex flex-col gap-5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                        <UserIcon size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{creatorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                      <Timer size={12} />
                      {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m ago
                  </div>
               </div>
               
               {order.status !== OrderStatus.READY ? (
                 isAllowedToUpdate ? (
                    <button 
                      onClick={() => updateOrderStatus(order.id, targetStatus!)}
                      className="w-full py-5 rounded-2xl font-bold text-white transition-all transform active:scale-95 hover:brightness-110 shadow-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
                      style={{ backgroundColor: currentTenant?.themeColor || '#0f172a' }}
                    >
                      {targetStatus === OrderStatus.PREPARING ? <PlayCircle size={18} /> : <CheckSquare size={18} />}
                      Bump to {targetStatus}
                    </button>
                 ) : (
                    <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-5 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 bg-slate-50/50">
                        <Lock size={14} /> Waiter Required
                    </div>
                 )
               ) : (
                 <div className="text-center text-emerald-600 font-bold py-5 bg-emerald-50 rounded-2xl animate-pulse uppercase tracking-widest text-[10px] border border-emerald-100 shadow-sm flex items-center justify-center gap-3">
                   <CheckCircle size={18} /> Ready for Service
                 </div>
               )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
