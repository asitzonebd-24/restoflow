
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, ItemStatus, Role, OrderItem } from '../types';
import { Clock, CheckCircle, Flame, Timer, PlayCircle, CheckSquare, FileText, Lock, Hash, User as UserIcon, ChevronDown, ShoppingBag, Printer, Plus, X, Search, AlertCircle, Pen, Minus } from 'lucide-react';
import { BluetoothPrinterService } from '../services/printerService';

export const Kitchen = () => {
  const { orders, updateOrderStatus, updateOrderItemStatus, currentTenant, currentUser, users, menu, updateOrderItems } = useApp();
  const [filter, setFilter] = React.useState<'pending' | 'done'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    
    // Only Owner, Manager, Kitchen, and Super Admin can see all orders
    const isAdmin = currentUser && [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN].includes(currentUser.role);
    const isKitchen = currentUser?.role === Role.KITCHEN;
    
    // Filter by creator if not admin/kitchen
    if (!isAdmin && !isKitchen && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }

    // Special filtering for Kitchen staff with assigned categories
    const hasAssignedCats = isKitchen && currentUser?.assignedCategories && currentUser.assignedCategories.length > 0;
    
    if (hasAssignedCats) {
      filtered = filtered.filter(order => {
        // Check if any item in this order belongs to the assigned categories
        return order.items.some(item => {
          const menuItem = menu.find(m => m.id === item.itemId);
          return menuItem && currentUser.assignedCategories?.includes(menuItem.category);
        });
      });
    }
    
    if (filter === 'pending') {
      if (hasAssignedCats) {
        // For kitchen staff, "Pending" means at least one of THEIR items is not ready
        filtered = filtered.filter(order => {
          const myItems = order.items.filter(item => {
            const menuItem = menu.find(m => m.id === item.itemId);
            return menuItem && currentUser.assignedCategories?.includes(menuItem.category);
          });
          return myItems.some(i => i.status === OrderStatus.PENDING || i.status === OrderStatus.PREPARING);
        });
      } else {
        filtered = filtered.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
      }
    } else {
      if (hasAssignedCats) {
        // For kitchen staff, "Done" means ALL of THEIR items are ready
        filtered = filtered.filter(order => {
          const myItems = order.items.filter(item => {
            const menuItem = menu.find(m => m.id === item.itemId);
            return menuItem && currentUser.assignedCategories?.includes(menuItem.category);
          });
          return myItems.length > 0 && myItems.every(i => i.status === OrderStatus.READY || i.status === OrderStatus.CANCELLED);
        });
      } else {
        filtered = filtered.filter(o => o.status === OrderStatus.READY);
      }
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
          bg: 'bg-pink-500', 
          text: 'text-pink-600', 
          lightBg: 'bg-pink-50',
          border: 'border-pink-500',
          lightBorder: 'border-pink-200',
          cardBorder: 'border-black',
        };
      case OrderStatus.PREPARING: 
        return { 
          bg: 'bg-blue-500', 
          text: 'text-blue-600', 
          lightBg: 'bg-blue-50',
          border: 'border-blue-500',
          lightBorder: 'border-blue-200',
          cardBorder: 'border-black',
        };
      case OrderStatus.READY: 
      case OrderStatus.COMPLETED:
        return { 
          bg: 'bg-emerald-500', 
          text: 'text-emerald-600', 
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-500',
          lightBorder: 'border-emerald-200',
          cardBorder: 'border-black',
        };
      case OrderStatus.CANCELLED:
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          lightBg: 'bg-red-50',
          border: 'border-red-500',
          lightBorder: 'border-red-200',
          cardBorder: 'border-red-200',
        };
      default: 
        return { 
          bg: 'bg-slate-900', 
          text: 'text-slate-900', 
          lightBg: 'bg-slate-50',
          border: 'border-slate-900',
          lightBorder: 'border-slate-200',
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
    if (userId === currentUser?.id) return currentUser?.name || 'Staff';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const handleAddItem = async (menuItemId: string) => {
    if (!selectedOrderId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return;

    const newItem: OrderItem = {
      rowId: Math.random().toString(36).substr(2, 9),
      itemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      status: OrderStatus.PENDING
    };

    const updatedItems = [...order.items, newItem];
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      setError(null);
      await updateOrderItems(order.id, updatedItems, newTotal);
      setShowAddItemModal(false);
      setSelectedOrderId(null);
      setQuantity(1);
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item. Please try again.');
    }
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menu, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(activeOrders.length / itemsPerPage);
  const paginatedOrders = activeOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
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
        ) : paginatedOrders.map(order => {
          const targetStatus = nextStatus(order.status);
          const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
          const isKitchen = currentUser?.role === Role.KITCHEN;
          const isAllowedToUpdate = isAdmin || isKitchen;
          const creatorName = getCreatorName(order.createdBy);
          
          const hasPending = order.items.some(i => i.status === OrderStatus.PENDING);
          const hasPreparing = order.items.some(i => i.status === OrderStatus.PREPARING);
          
          const derivedStatus = hasPending 
            ? OrderStatus.PENDING 
            : (hasPreparing ? OrderStatus.PREPARING : order.status);
            
          const statusColors = getStatusColors(derivedStatus);
          
          return (
          <div key={order.id} className="group relative rounded-[2.5rem] shadow-xl bg-white flex flex-col h-full transition-all border-4 border-black min-h-[400px] overflow-hidden">
            {/* Top Border Color */}
            <div className={`absolute top-0 left-0 right-0 h-4 ${statusColors.bg}`}></div>
            
            <div className="relative z-10 flex flex-col h-full p-6 pt-10">
              <div className="flex flex-col items-center mb-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Kitchen Token</h3>
                <div className={`w-10 h-1.5 rounded-full mt-1.5 ${statusColors.bg}`}></div>
              </div>

              {/* Centered Token Number Pill with Table Number Badge */}
                <div className="flex justify-center mb-6 relative">
                <div className={`w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-black text-lg text-white shadow-xl ${statusColors.bg}`}>
                  {order.tokenNumber}
                </div>
                {(order.tableNumber || order.deliveryStaffName) && (
                  <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">
                    {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                  </div>
                )}
                <button
                  onClick={async () => {
                    if (currentTenant?.printerSettings?.pairedPrinterId) {
                      try {
                        const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
                        if (result.success) {
                          const orderData = {
                            tokenNumber: order.tokenNumber,
                            tableNumber: order.tableNumber,
                            items: order.items.filter(i => i.status === OrderStatus.PENDING),
                            note: order.note,
                            createdAt: order.createdAt,
                            creatorName: getCreatorName(order.createdBy)
                          };
                          await BluetoothPrinterService.printKOT(currentTenant, orderData as any);
                        } else {
                          alert('Failed to connect to printer.');
                        }
                      } catch (error) {
                        console.error('Bluetooth print failed:', error);
                        alert('Failed to print KOT. Please check printer connection.');
                      }
                    } else {
                      alert('No printer paired. Please pair a printer in Settings.');
                    }
                  }}
                  className="absolute -top-2 -left-2 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-lg hover:bg-indigo-700 transition-all"
                  title="Print KOT"
                >
                  <Printer size={12} />
                </button>
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
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Edit Items</h4>
                {isAdmin && order.status !== OrderStatus.READY && (
                  <button 
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setShowEditItemsModal(true);
                    }}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100"
                  >
                    <Pen size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
              {(() => {
                const groupedItems: { [key: string]: { name: string, quantity: number, status: ItemStatus, rowIds: string[] } } = {};
                order.items.forEach(item => {
                  // Filter items by category for kitchen staff
                  if (isKitchen && currentUser?.assignedCategories && currentUser.assignedCategories.length > 0) {
                    const menuItem = menu.find(m => m.id === item.itemId);
                    if (!menuItem || !currentUser.assignedCategories.includes(menuItem.category)) {
                      return; // Skip this item
                    }
                  }

                  const status = item.status || OrderStatus.PENDING;
                  // Only group if status is PREPARING ("Ready") or READY ("Done")
                  // If status is PENDING ("New"), use rowId as part of the key to keep them separate
                  const key = (status === OrderStatus.PREPARING || status === OrderStatus.READY)
                    ? `${item.itemId}-${status}`
                    : `${item.itemId}-${status}-${item.rowId}`;

                  if (!groupedItems[key]) {
                    groupedItems[key] = {
                      name: item.name,
                      quantity: 0,
                      status: status as ItemStatus,
                      rowIds: []
                    };
                  }
                  groupedItems[key].quantity += item.quantity;
                  groupedItems[key].rowIds.push(item.rowId);
                });

                return Object.entries(groupedItems).map(([key, group], index) => {
                  const itemStatusColors = getStatusColors(group.status);
                  return (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between px-3 py-1.5 transition-colors ${itemStatusColors.lightBg} border-2 ${itemStatusColors.border} rounded-lg mb-2`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black ${itemStatusColors.text}`}>{group.quantity}x</span>
                        <h4 className={`text-xs font-black capitalize tracking-tight ${group.status === OrderStatus.CANCELLED ? 'text-red-600 line-through' : group.status === OrderStatus.READY ? 'text-slate-300 line-through' : itemStatusColors.text}`}>
                          {group.name}
                        </h4>
                      </div>
                      
                      <div className="relative">
                          <select 
                              value={group.status}
                              disabled={!isAllowedToUpdate || (group.status === OrderStatus.READY && !isAdmin)}
                              onChange={(e) => updateOrderItemStatus(order.id, group.rowIds, e.target.value as ItemStatus)}
                              className={`text-[9px] font-black uppercase py-1.5 pl-4 pr-8 rounded-full border-2 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${itemStatusColors.lightBg} ${itemStatusColors.border} ${itemStatusColors.text}`}
                          >
                              <option value={OrderStatus.PENDING}>New</option>
                              <option value={OrderStatus.PREPARING}>READY</option>
                              <option value={OrderStatus.READY}>Done</option>
                              <option value={OrderStatus.CANCELLED} disabled={!isAdmin}>Cancel</option>
                          </select>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${itemStatusColors.text}`} size={12} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserIcon size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{getCreatorName(order.createdBy).split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold">{formatTime(order.createdAt)}</span>
                  </div>
               </div>
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
                 <div className="flex flex-col gap-3">
                   <div className="text-center text-emerald-600 font-black py-5 bg-emerald-50 rounded-[1.5rem] uppercase tracking-widest text-xs border-2 border-emerald-100 shadow-sm flex items-center justify-center gap-3">
                     <CheckCircle size={18} /> READY FOR SERVICE
                   </div>
                   <button 
                     onClick={async () => {
                       if (currentTenant?.printerSettings?.pairedPrinterId) {
                         try {
                           const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
                           if (result.success) {
                             await BluetoothPrinterService.printInvoice(currentTenant, order, { 
                               creatorName: getCreatorName(order.createdBy)
                             });
                           }
                         } catch (error) {
                           console.error('Bluetooth print failed:', error);
                           alert('Failed to print invoice. Please check printer connection.');
                         }
                       } else {
                         alert('No printer paired. Please pair a printer in Settings.');
                       }
                     }}
                     className="w-full py-4 rounded-[1.5rem] font-black text-white transition-all transform active:scale-95 hover:brightness-110 shadow-xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 bg-emerald-600"
                   >
                     <Printer size={18} /> PRINT INVOICE
                   </button>
                 </div>
               )}
            </div>
          </div>
          </div>
        )})}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            Previous
          </button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddItemModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-black flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Add New Item</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select item to add to token</p>
              </div>
              <button onClick={() => setShowAddItemModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Quantity:</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-white border-2 border-indigo-200 rounded-lg flex items-center justify-center font-black text-indigo-600 hover:bg-indigo-100 transition-all"
                  >
                    -
                  </button>
                  <span className="text-lg font-black text-indigo-600 w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 bg-white border-2 border-indigo-200 rounded-lg flex items-center justify-center font-black text-indigo-600 hover:bg-indigo-100 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item.id)}
                    className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900 capitalize tracking-tight group-hover:text-indigo-600">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-600">{currentTenant?.currency}{item.price}</p>
                      <Plus size={16} className="text-slate-300 group-hover:text-indigo-500 ml-auto mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Items Modal */}
      {showEditItemsModal && selectedOrderId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditItemsModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-black flex flex-col max-h-[80vh]">
            <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Edit Order Items</h3>
              <button onClick={() => setShowEditItemsModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
              {orders.find(o => o.id === selectedOrderId)?.items.map(item => (
                <div key={item.rowId} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                  <span className="font-bold text-sm w-1/2 truncate">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const order = orders.find(o => o.id === selectedOrderId);
                        if (!order) return;
                        const updatedItems = order.items.map(i => 
                          i.rowId === item.rowId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
                        ).filter(i => i.quantity > 0);
                        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        updateOrderItems(order.id, updatedItems, newTotal);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const order = orders.find(o => o.id === selectedOrderId);
                        if (!order) return;
                        const updatedItems = order.items.map(i => 
                          i.rowId === item.rowId ? { ...i, quantity: i.quantity + 1 } : i
                        );
                        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        updateOrderItems(order.id, updatedItems, newTotal);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-emerald-50 hover:text-emerald-500"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
