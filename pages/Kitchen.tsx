
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, ItemStatus, Role } from '../types';
import { Clock, CheckCircle, Flame, Timer, PlayCircle, CheckSquare, FileText, Lock, Hash, User as UserIcon, ChevronDown, ShoppingBag } from 'lucide-react';

export const Kitchen = () => {
  const { orders, updateOrderStatus, updateOrderItemStatus, currentTenant, currentUser, users } = useApp();
  const [filter, setFilter] = React.useState<'pending' | 'done'>('pending');

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    if (filter === 'pending') {
      // Show orders that are not completed and not ready (or ready but still in kitchen)
      // Actually, let's follow the user's "Pending" vs "Done"
      // Pending: PENDING, PREPARING
      // Done: READY
      filtered = filtered.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    } else {
      filtered = filtered.filter(o => o.status === OrderStatus.READY);
    }

    // Sort by creation time (newest first for done, oldest first for pending)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return filter === 'pending' ? timeA - timeB : timeB - timeA;
    });
  }, [orders, filter]);

  const getStatusColors = (status: OrderStatus | ItemStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { 
          bg: 'bg-rose-500', 
          text: 'text-rose-600', 
          lightBg: 'bg-rose-50',
          border: 'border-rose-500',
          cardBorder: 'border-black',
        };
      case OrderStatus.PREPARING: 
        return { 
          bg: 'bg-amber-500', 
          text: 'text-amber-600', 
          lightBg: 'bg-amber-50',
          border: 'border-amber-500',
          cardBorder: 'border-black',
        };
      case OrderStatus.READY: 
      case OrderStatus.COMPLETED:
        return { 
          bg: 'bg-emerald-500', 
          text: 'text-emerald-600', 
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-500',
          cardBorder: 'border-black',
        };
      default: 
        return { 
          bg: 'bg-slate-900', 
          text: 'text-slate-900', 
          lightBg: 'bg-slate-50',
          border: 'border-slate-900',
          cardBorder: 'border-black',
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
    return [Role.OWNER, Role.MANAGER, Role.WAITER, Role.KITCHEN].includes(userRole);
  };

  const getCreatorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  return (
    <div className="p-4 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-8 md:mb-12 flex flex-col items-start gap-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1a37] flex items-center justify-center shadow-xl">
                <Flame className="text-orange-500 animate-pulse" size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-[#1a1a37] uppercase tracking-tighter">Live Kitchen</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time token monitoring</p>
            </div>
        </div>

        <div className="flex flex-col items-start gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full md:w-64">
            <button 
              onClick={() => setFilter('pending')}
              className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-[#1a1a37] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('done')}
              className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'done' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Done
            </button>
          </div>

          <button className="bg-rose-100 px-6 py-3 rounded-2xl border-2 border-rose-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-rose-800 w-full md:w-64">
            {filter === 'pending' ? 'Active Orders' : 'Completed Orders'}: <span className="text-rose-900 text-sm">{activeOrders.length}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
        {activeOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-96 bg-white rounded-[2.5rem] shadow-xl border-2 border-dashed border-slate-200">
                <CheckCircle size={64} strokeWidth={1} className="text-slate-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Kitchen Clear</h3>
                <p className="text-sm text-slate-400 mt-2">No {filter} orders at the moment.</p>
            </div>
        ) : activeOrders.map(order => {
          const targetStatus = nextStatus(order.status);
          const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
          const isKitchen = currentUser?.role === Role.KITCHEN;
          const isAllowedToUpdate = isAdmin || isKitchen;
          const creatorName = getCreatorName(order.createdBy);
          const statusColors = getStatusColors(order.status);
          
          return (
          <div key={order.id} className="group relative rounded-[2.5rem] shadow-xl bg-white flex flex-col h-full transition-all border-4 border-black min-h-[400px] overflow-hidden">
            {/* Top Border Color */}
            <div className={`absolute top-0 left-0 right-0 h-4 ${statusColors.bg}`}></div>
            
            <div className="relative z-10 flex flex-col h-full p-6 pt-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{creatorName.split(' ')[0].toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">Kitchen Token</p>
                  <div className={`w-8 h-1.5 ml-auto rounded-full ${statusColors.bg}`}></div>
                </div>
              </div>

              {/* Centered Token Number Pill with Table Number Badge */}
                <div className="flex justify-center mb-6 relative">
                <div className={`min-w-[3rem] px-3 h-12 rounded-[1.5rem] border-2 border-black flex items-center justify-center font-black text-xl text-white shadow-xl ${statusColors.bg}`}>
                  {order.tokenNumber}
                </div>
                {(order.tableNumber || order.deliveryStaffName) && (
                  <div className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                    {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : `T-${order.tableNumber}`}
                  </div>
                )}
              </div>

            {order.deliveryStaffName && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={12} className="text-indigo-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Delivery Staff</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-slate-900">{order.deliveryStaffName}</p>
                  {order.deliveryStaffMobile && <p className="text-[9px] font-medium text-slate-500">{order.deliveryStaffMobile}</p>}
                </div>
              </div>
            )}

            {order.note && (
                <div className="bg-amber-50 p-4 rounded-2xl mb-4 text-[10px] text-amber-800 border border-amber-100 flex gap-3 italic font-bold uppercase tracking-wider">
                    <FileText size={14} className="shrink-0 text-amber-500"/>
                    <span>"{order.note}"</span>
                </div>
            )}

            <div className="flex-1 mb-6 overflow-y-auto no-scrollbar rounded-2xl border border-slate-100 overflow-hidden bg-white">
              {order.items.map((item, index) => {
                 const itemStatusColors = getStatusColors(item.status || OrderStatus.PENDING);
                 return (
                  <div 
                    key={item.rowId} 
                    className={`flex items-center justify-between p-4 bg-white transition-colors hover:bg-slate-50 ${index !== order.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${itemStatusColors.text}`}>{item.quantity}x</span>
                      <h4 className={`text-xs font-black uppercase tracking-tight ${item.status === OrderStatus.READY ? 'text-slate-300 line-through' : 'text-[#1a1a37]'}`}>
                        {item.name}
                      </h4>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={item.status || OrderStatus.PENDING}
                            disabled={!isAllowedToUpdate}
                            onChange={(e) => updateOrderItemStatus(order.id, item.rowId, e.target.value as ItemStatus)}
                            className={`text-[9px] font-black uppercase py-1.5 pl-4 pr-8 rounded-full border-2 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${itemStatusColors.lightBg} ${itemStatusColors.border} ${itemStatusColors.text}`}
                        >
                            <option value={OrderStatus.PENDING}>New</option>
                            <option value={OrderStatus.PREPARING}>Ready</option>
                            <option value={OrderStatus.READY}>Done</option>
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${itemStatusColors.text}`} size={12} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
               {order.status !== OrderStatus.READY ? (
                 isAllowedToUpdate ? (
                    <button 
                      onClick={() => updateOrderStatus(order.id, targetStatus!)}
                      className="w-full py-5 rounded-[1.5rem] font-black text-white transition-all transform active:scale-95 hover:brightness-110 shadow-xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 bg-[#1a1a37]"
                    >
                      BUMP {targetStatus === OrderStatus.PREPARING ? 'READY' : 'DONE'}
                    </button>
                 ) : (
                    <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center gap-3 bg-slate-50/50">
                        <Lock size={14} /> ADMIN REQUIRED
                    </div>
                 )
               ) : (
                 <div className="text-center text-emerald-600 font-black py-5 bg-emerald-50 rounded-[1.5rem] uppercase tracking-widest text-xs border-2 border-emerald-100 shadow-sm flex items-center justify-center gap-3">
                   <CheckCircle size={18} /> READY FOR SERVICE
                 </div>
               )}
            </div>
          </div>
          </div>
        )})}
      </div>
    </div>
  );
};
