import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  Hash, 
  X, 
  ShoppingCart, 
  Minus, 
  Plus, 
  FileText, 
  ArrowRight, 
  Printer, 
  User, 
  Package, 
  Search,
  ChevronRight,
  Trash2,
  PlusCircle,
  Settings,
  LayoutGrid,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  MoreVertical,
  Table as TableIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderItem, Role, OrderStatus } from '../types';

export const POS = () => {
  const { 
    menu, 
    currentTenant, 
    currentUser, 
    addOrder, 
    updateOrderItems, 
    updateOrderStatus, 
    updateOrderPaymentStatus, 
    orders, 
    users, 
    isLoading, 
    categories, 
    tables, 
    addTable, 
    deleteTable, 
    createPrintRequest, 
    getNextToken 
  } = useApp();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Select Categories');
  const [orderNote, setOrderNote] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTokenNum, setNewTokenNum] = useState("");
  const [newTableNum, setNewTableNum] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState("Dine In");
  const [selectedDeliveryStaffId, setSelectedDeliveryStaffId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalActiveTab, setTerminalActiveTab] = useState<"pending" | "done" | "paid">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingTableModalOpen, setIsAddingTableModalOpen] = useState(false);
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [newTableNameInput, setNewTableNameInput] = useState("");
  
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState("1");
  const [customItemPrice, setCustomItemPrice] = useState("0");

  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [terminalActiveTab]);

  if (isLoading || !currentTenant || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Terminal...</p>
        </div>
      </div>
    );
  }

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const deliveryStaff = users.filter(u => u.role === Role.DELIVERY);

  const activeOrdersCount = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length;

  const filteredOrders = orders.filter(o => {
    let matchesCategory = true;
    if (!(currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.KITCHEN)) {
      matchesCategory = o.createdBy === currentUser.id;
    }
    
    if (!matchesCategory) return false;

    if (terminalActiveTab === 'pending') {
      return o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED && (o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING) && !o.isPaid;
    } else if (terminalActiveTab === 'done') {
      return o.status === OrderStatus.READY && !o.isPaid;
    } else if (terminalActiveTab === 'paid') {
      return o.isPaid && o.status !== OrderStatus.CANCELLED;
    }
    return false;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return terminalActiveTab === 'pending' ? timeA - timeB : timeB - timeA;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getWaiterName = (id: string) => {
    if (id === currentUser?.id) return currentUser?.name || 'Staff';
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown';
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', topBorder: 'bg-pink-500' };
      case OrderStatus.PREPARING: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', topBorder: 'bg-blue-500' };
      case OrderStatus.READY:
      case OrderStatus.COMPLETED: return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', topBorder: 'bg-emerald-500' };
      case OrderStatus.CANCELLED: return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', topBorder: 'bg-red-500' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', topBorder: 'bg-slate-500' };
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCart(order.items.map(item => ({ ...item, isExisting: true } as any)));
    setOrderNote(order.note || "");
    setOrderType(order.deliveryStaffId ? "Online Delivery" : (order.tableNumber === "Take Away" ? "Take Away" : "Dine In"));
    setSelectedDeliveryStaffId(order.deliveryStaffId || "");
    setDeliveryAddress(order.deliveryAddress || "");
    setIsCreatingNew(false);
  };

  const handlePrintOrder = async (e: React.MouseEvent, order: Order, type: 'kot' | 'invoice' = 'invoice') => {
    e.stopPropagation();
    try {
      await createPrintRequest(order, type);
    } catch (err) {
      console.error('Print failed:', err);
    }
  };

  const handleNewOrder = () => {
    const nextToken = getNextToken();
    setNewTokenNum(nextToken);
    setNewTableNum("");
    setIsCreatingNew(true);
    setSelectedOrderId(null);
    setCart([]);
    setOrderNote("");
    setOrderType("Dine In");
    setSelectedDeliveryStaffId("");
    setDeliveryAddress("");
  };

  const addToCart = (item: any) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) return;
    
    setCart(prev => {
      const idx = prev.findIndex(i => i.itemId === item.id && i.status === OrderStatus.PENDING && !(i as any).isExisting);
      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        if (item.stock !== undefined && item.stock !== null && currentQty >= item.stock) return prev;
        const newCart = [...prev];
        newCart[idx] = { ...newCart[idx], quantity: currentQty + 1, isExisting: false };
        return newCart;
      }
      return [...prev, {
        rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        status: OrderStatus.PENDING
      }];
    });
  };

  const updateQuantity = (rowId: string, delta: number) => {
    const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
    
    setCart(prev => prev.map(item => {
      if (item.rowId === rowId) {
        const isExisting = (item as any).isExisting;
        if (isExisting && !isAdmin) return item;
        
        const menuItem = menu.find(m => m.id === item.itemId);
        const newQty = item.quantity + delta;
        
        if (delta > 0 && menuItem && menuItem.stock !== undefined && menuItem.stock !== null && newQty > menuItem.stock) return item;
        
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const isTokenDuplicate = useMemo(() => {
    if (!isCreatingNew) return false;
    return orders.some(o => {
      const tenantTz = currentTenant?.timezone || 'UTC';
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tenantTz, year: 'numeric', month: '2-digit', day: '2-digit' });
      const today = formatter.format(new Date());
      const orderDate = formatter.format(new Date(o.createdAt));
      return orderDate === today && o.tokenNumber === newTokenNum;
    });
  }, [isCreatingNew, orders, newTokenNum, currentTenant]);

  const createAndSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      setErrorMessage(null);
      if (isCreatingNew) {
        // Global duplicate re-check right before submission to minimize race condition
        const latestToken = getNextToken();
        const tokenToUse = latestToken;
        
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const items = cart.map(({ isExisting, ...rest }: any) => rest);
        const deliveryMan = deliveryStaff.find(s => s.id === selectedDeliveryStaffId);
        
        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          tenantId: currentTenant.id,
          tokenNumber: tokenToUse,
          tableNumber: orderType === 'Online Delivery' ? 'Delivery' : (orderType === 'Take Away' ? 'Take Away' : newTableNum),
          items,
          status: OrderStatus.PENDING,
          isPaid: false,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id,
          creatorName: currentUser.name || currentUser.email?.split('@')[0] || 'Staff',
          totalAmount: total,
          note: orderNote,
          deliveryStaffId: orderType === 'Online Delivery' ? selectedDeliveryStaffId : null,
          deliveryStaffName: orderType === 'Online Delivery' && deliveryMan ? deliveryMan.name : null,
          deliveryStaffMobile: orderType === 'Online Delivery' && deliveryMan ? deliveryMan.mobile : null,
          deliveryAddress: orderType === 'Online Delivery' ? deliveryAddress : null
        };
        
        await addOrder(newOrder);
        
        // Success cleanup
        setSelectedOrderId(null);
        setIsCreatingNew(false);
        setCart([]);
        setOrderNote("");
        setNewTableNum("");
        setNewTokenNum("");
        setOrderType("Dine In");
        setSelectedDeliveryStaffId("");
        setDeliveryAddress("");
        
        if (!currentTenant?.printerSettings?.enablePrintAgent && currentTenant?.printerSettings?.autoPrintKOT) {
           // Auto print logic here if needed
        }
        
      } else if (selectedOrderId) {
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const hasNewItems = cart.some((i: any) => !i.isExisting);
        const items = cart.map(({ isExisting, ...rest }: any) => rest);
        const deliveryMan = deliveryStaff.find(s => s.id === selectedDeliveryStaffId);
        
        await updateOrderItems(
          selectedOrderId, 
          items, 
          total, 
          orderNote, 
          hasNewItems ? OrderStatus.PENDING : null,
          orderType === 'Online Delivery' ? selectedDeliveryStaffId : null,
          orderType === 'Online Delivery' && deliveryMan ? deliveryMan.name : null,
          orderType === 'Online Delivery' && deliveryMan ? deliveryMan.mobile : null,
          orderType === 'Online Delivery' ? deliveryAddress : null,
          hasNewItems ? false : undefined
        );

        setSelectedOrderId(null);
        setIsCreatingNew(false);
        setCart([]);
        setOrderNote("");
        setNewTableNum("");
        setNewTokenNum("");
        setOrderType("Dine In");
        setSelectedDeliveryStaffId("");
        setDeliveryAddress("");
      }
    } catch (err: any) {
      console.error("Failed to submit order:", err);
      let msg = "Unknown error";
      try {
        msg = JSON.parse(err.message).error || err.message;
      } catch {
        msg = err.message || "Unknown error";
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenu = useMemo(() => {
    if (!activeCategory || activeCategory === 'Select Categories') return [];
    return menu.filter(item => {
      const matchesCategory = item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, activeCategory, searchQuery]);

  const addCustomItemToCart = () => {
    if (!customItemName.trim() || parseFloat(customItemPrice) <= 0) return;
    
    setCart(prev => [...prev, {
      rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: `custom-${Date.now()}`,
      name: customItemName,
      quantity: parseInt(customItemQuantity) || 1,
      price: parseFloat(customItemPrice),
      status: OrderStatus.PENDING
    }]);
    
    setCustomItemName("");
    setCustomItemQuantity("1");
    setCustomItemPrice("0");
    setIsCustomOrderModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {!selectedOrderId && !isCreatingNew ? (
        <div className="p-4 md:p-10 h-full overflow-y-auto no-scrollbar">
          <div className="flex flex-col md:flex-row md:items-center gap-10 mb-8 md:mb-12">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#1a1a37] flex items-center justify-center shadow-xl shrink-0">
                   <LayoutGrid className="text-indigo-500" size={24} />
                </div>
                <div className="min-w-fit">
                   <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Active Terminals</h1>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global floor tracking & management</p>
                </div>
             </div>

             <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto ml-1 md:ml-0">
               <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full md:w-auto">
                 <button 
                  onClick={() => setTerminalActiveTab("pending")} 
                  className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest select-none ${terminalActiveTab === 'pending' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                 >
                   Pending
                 </button>
                 <button 
                  onClick={() => setTerminalActiveTab("done")} 
                  className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest select-none ${terminalActiveTab === 'done' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                 >
                   Done
                 </button>
                 <button 
                  onClick={() => setTerminalActiveTab("paid")} 
                  className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest select-none ${terminalActiveTab === 'paid' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                 >
                   Paid
                 </button>
               </div>

               <div className="flex flex-row gap-3 w-full md:w-auto">
                 <button 
                  onClick={handleNewOrder}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-indigo-500 w-full md:w-auto h-[52px] shrink-0"
                 >
                   <Plus size={18} /> New Order
                 </button>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-6">
            <AnimatePresence mode="popLayout">
              {paginatedOrders.map(order => {
                const isPending = order.items.some(it => it.status === OrderStatus.PENDING);
                const isPreparing = order.items.some(it => it.status === OrderStatus.PREPARING);
                const derivedStatus = isPending ? OrderStatus.PENDING : (isPreparing ? OrderStatus.PREPARING : order.status);
                const config = getStatusConfig(derivedStatus);
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => handleEditOrder(order)}
                    className="group relative bg-white rounded-[2.5rem] shadow-2xl border-4 border-black transition-all duration-300 text-left flex flex-col min-h-[280px] hover:scale-[1.02] overflow-hidden cursor-pointer"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-4 ${config.topBorder}`} />
                    <div className="relative z-10 flex flex-col h-full p-6 pt-10">
                       <div className="flex justify-center mb-6 relative">
                         <div className={`w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-black ${order.tokenNumber.length > 3 ? 'text-[10px]' : (order.tokenNumber.length > 2 ? 'text-sm' : 'text-lg')} text-white shadow-xl ${config.topBorder}`}>
                           {order.tokenNumber}
                         </div>
                         {(order.tableNumber || order.deliveryStaffName) && (
                            <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">
                               {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                            </div>
                         )}
                         {terminalActiveTab !== 'pending' && (
                           <div className="absolute -top-2 -left-2 bg-white rounded-full border-2 border-black shadow-lg uppercase">
                              <select 
                                value={order.isPaid ? 'paid' : 'unpaid'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); updateOrderPaymentStatus(order.id, e.target.value === 'paid'); }}
                                className="text-[9px] font-black px-2 py-0.5 rounded-full bg-transparent outline-none cursor-pointer"
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                              </select>
                           </div>
                         )}
                       </div>

                       <div className="mb-4 space-y-1">
                          {(() => {
                            const summary: Record<string, any> = {};
                            order.items.forEach(it => {
                              const st = it.status || OrderStatus.PENDING;
                              const sk = `${it.itemId}-${st}`;
                              if (!summary[sk]) summary[sk] = { name: it.name, quantity: 0, status: st };
                              summary[sk].quantity += it.quantity;
                            });
                            return Object.entries(summary).map(([k, v]) => {
                              const sc = getStatusConfig(v.status);
                              return (
                                <div key={k} className={`flex justify-between items-center text-[10px] font-bold capitalize tracking-widest px-2 py-0.5 rounded-md border-2 ${sc.bg} ${sc.topBorder.replace('bg-', 'border-')}`}>
                                  <span className={`${sc.text} ${v.status === OrderStatus.READY || v.status === OrderStatus.COMPLETED || v.status === OrderStatus.CANCELLED ? 'line-through opacity-50' : ''}`}>{v.name}</span>
                                  <span className={sc.text}>x{v.quantity}</span>
                                </div>
                              );
                            });
                          })()}
                       </div>

                       <div className="mt-auto flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-4">
                          <div className="flex items-center gap-2">
                             <User size={14} className="text-slate-400" />
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{getWaiterName(order.createdBy).split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             {(terminalActiveTab === 'done' || terminalActiveTab === 'pending') && (
                               <button 
                                 onClick={(e) => {
                                   const freshOrder = orders.find(o => o.id === order.id);
                                   handlePrintOrder(e, freshOrder || order, terminalActiveTab === 'pending' ? 'kot' : 'invoice');
                                 }}
                                 className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"
                                 title={terminalActiveTab === 'pending' ? "Print KOT" : "Print Invoice"}
                               >
                                 <Printer size={16} />
                               </button>
                             )}
                             <div className="bg-black text-white px-4 py-2 rounded-full font-black text-sm flex items-center gap-1 shadow-lg">
                                <span className="text-[10px] opacity-60">{currentTenant.currency}</span>
                                {order.totalAmount.toFixed(0)}
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredOrders.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                <Package size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">No active orders</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pb-12">
               <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
               >
                 Previous
               </button>
               <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
               <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
               >
                 Next
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col bg-slate-50/50 h-full overflow-hidden">
          <div className="p-4 md:p-8 bg-white border-b border-slate-100 shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="flex items-start md:items-center gap-3 md:gap-6 w-full md:w-auto">
                <button 
                  onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-90"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1">
                   <h2 className="text-base md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 md:gap-4 flex-wrap">
                     {isCreatingNew ? 'New Order Terminal' : `Token #${orders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
                     <button 
                         onClick={() => setIsCustomOrderModalOpen(true)}
                         className="text-[9px] md:text-xs font-medium text-white bg-indigo-600 px-2 md:px-3 py-1 rounded-full whitespace-nowrap hover:bg-indigo-700 transition-colors"
                       >
                         Custom Order
                       </button>
                   </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isCreatingNew && (
                <>
                  <div className="flex items-center justify-center gap-2 bg-indigo-50 px-4 py-3 rounded-xl md:rounded-2xl border-2 border-indigo-500 w-full min-h-[52px]">
                    <span className="text-[10px] md:text-[11px] text-indigo-800 font-black uppercase tracking-widest">Token:</span>
                    <div className="text-center font-black text-sm md:text-lg text-indigo-900">
                      <span>#{newTokenNum || '--'}</span>
                    </div>
                  </div>

                  <div className="relative w-full">
                    <select 
                      value={orderType} 
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full pl-4 pr-8 py-3 bg-white border-2 border-indigo-500 rounded-xl md:rounded-2xl text-xs font-black uppercase tracking-widest appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer min-h-[52px]"
                    >
                      <option value="Dine In">Dine In</option>
                      <option value="Take Away">Take Away</option>
                      <option value="Online Delivery">Online Delivery</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 rotate-90" size={16} />
                  </div>
                </>
              )}

              {orderType === 'Online Delivery' && (
                 <div className="flex items-center justify-center gap-2 bg-slate-50 px-4 py-3 rounded-xl md:rounded-2xl border-2 border-slate-900 w-full min-h-[52px]">
                    <select 
                      value={selectedDeliveryStaffId} 
                      onChange={(e) => setSelectedDeliveryStaffId(e.target.value)}
                      className="w-full text-center bg-transparent font-black text-xs outline-none text-slate-900"
                    >
                      <option value="">Select Delivery Staff</option>
                      {deliveryStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
              )}


              {orderType === 'Dine In' ? (
                <div className="flex items-center justify-center gap-2 bg-slate-50 px-4 py-3 rounded-xl md:rounded-2xl border-2 border-slate-900 w-full min-h-[52px]">
                   <select 
                    value={newTableNum} 
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsAddingTableModalOpen(true);
                        setNewTableNum("");
                      } else {
                        setNewTableNum(e.target.value);
                      }
                    }}
                    className="w-full text-center bg-transparent font-black text-xs outline-none text-slate-900"
                   >
                     <option value="" disabled>Select Table</option>
                     {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                     {(currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN) && (
                       <option value="__ADD_NEW__" className="font-bold text-indigo-600">⚙ Manage</option>
                     )}
                   </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 opacity-50">
                   <span className="text-[10px] font-black uppercase text-slate-400">No Table Req</span>
                </div>
              )}

              <div className="relative col-span-1 md:col-span-1 w-full">
                <select 
                  value={activeCategory} 
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 bg-white border-2 border-black rounded-xl md:rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-sm min-h-[52px]"
                >
                   <option value="Select Categories">Select Categories</option>
                   {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-32">
            {activeCategory !== 'Select Categories' && (
              <div className="flex flex-col bg-white rounded-[2rem] border-[2.5px] border-black overflow-hidden shadow-xl shadow-slate-200/20 divide-y-[2.5px] divide-black">
                  {filteredMenu.map(item => {
                    const cartItem = cart.find(ci => ci.itemId === item.id && !(ci as any).isExisting);
                    return (
                      <div 
                        key={item.id}
                        className="py-0.5 px-4 flex flex-col bg-white hover:bg-slate-50 transition-colors"
                      >
                         <div className="w-full">
                            <h4 className="font-bold text-slate-900 text-[14px] leading-none capitalize">{item.name}</h4>
                            {item.description && <p className="text-slate-400 text-[8px] font-medium leading-none mt-0.5">{item.description}</p>}
                         </div>
                         <div className="flex items-center justify-between w-full -mt-1">
                            <span className="text-[15px] font-black text-rose-800">{currentTenant.currency}{item.price.toFixed(0)}</span>
                            <div className="flex items-center shrink-0">
                              {cartItem ? (
                                 <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                  <button 
                                   onClick={(e) => { e.stopPropagation(); updateQuantity(cartItem.rowId, -1); }}
                                   className="w-8 h-8 flex items-center justify-center text-rose-800 hover:bg-slate-50 border-r-2 border-slate-200 transition-colors"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <div className="w-10 h-8 flex items-center justify-center font-black text-sm text-slate-900 bg-slate-50/50">{cartItem.quantity}</div>
                                  <button 
                                   onClick={(e) => { e.stopPropagation(); updateQuantity(cartItem.rowId, 1); }}
                                   className="w-8 h-8 flex items-center justify-center text-rose-800 hover:bg-slate-50 border-l-2 border-slate-200 transition-colors"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                 onClick={() => addToCart(item)}
                                 className="w-10 h-10 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-full transition-all active:scale-90 border-2 border-transparent"
                                >
                                  <PlusCircle size={28} strokeWidth={1.5} />
                                </button>
                              )}
                            </div>
                         </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {activeCategory !== 'Select Categories' && filteredMenu.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <Search size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">No items found</p>
              </div>
            )}
          </div>

          {/* Floating Bottom Submission Bar */}
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-0 left-0 right-0 z-[60] p-4 lg:p-6"
              >
                <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 backdrop-blur-xl bg-slate-900/95">
                  <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full justify-center">
                      <button 
                        onClick={() => setIsPreviewModalOpen(true)}
                        className={`flex-1 px-8 py-3 md:py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-indigo-900/40`}
                      >
                        <span>Preview Order</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error Message Modal */}
      <AnimatePresence>
        {errorMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-2 border-rose-100"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tighter mb-2">Submission Failed</h3>
              <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">{errorMessage}</p>
              <button 
                onClick={() => setErrorMessage(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Order Modal */}
      <AnimatePresence>
        {isCustomOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-black text-slate-900 mb-2">Custom Order</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Special Drink"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
                      <input 
                        type="number" 
                        value={customItemQuantity}
                        onChange={(e) => setCustomItemQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</label>
                      <input 
                        type="number" 
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setIsCustomOrderModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={addCustomItemToCart}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                   >
                     Add to Cart
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Order Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto no-scrollbar">
                <h3 className="text-xl font-black text-slate-900 mb-4">Order Preview</h3>
                <div className="space-y-4">
                  {cart.map(item => {
                    const isExisting = (item as any).isExisting;
                    const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
                    const canEdit = !isExisting || isAdmin;

                    return (
                      <div key={item.rowId} className={`flex items-center justify-between py-3 border-b last:border-0 ${isExisting ? 'opacity-70 bg-slate-50/50 -mx-4 px-4' : ''}`}>
                        <div className="flex flex-col flex-1">
                          <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                          {isExisting && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Already Saved</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className={`flex items-center border-2 ${isExisting ? 'border-slate-100 bg-slate-100' : 'border-slate-200 bg-white'} rounded-xl overflow-hidden shadow-sm`}>
                             <button 
                              onClick={() => canEdit && updateQuantity(item.rowId, -1)}
                              disabled={!canEdit}
                              className={`w-8 h-8 flex items-center justify-center ${canEdit ? 'text-rose-800 hover:bg-slate-50' : 'text-slate-300'} border-r-2 ${isExisting ? 'border-slate-50' : 'border-slate-200'} transition-colors`}
                             >
                               <Minus size={16} strokeWidth={2.5} />
                             </button>
                             <div className={`w-10 h-8 flex items-center justify-center font-black text-sm ${isExisting ? 'text-slate-500' : 'text-slate-900'} bg-transparent`}>{item.quantity}</div>
                             <button 
                              onClick={() => canEdit && updateQuantity(item.rowId, 1)}
                              disabled={!canEdit}
                              className={`w-8 h-8 flex items-center justify-center ${canEdit ? 'text-rose-800 hover:bg-slate-50' : 'text-slate-300'} border-l-2 ${isExisting ? 'border-slate-50' : 'border-slate-200'} transition-colors`}
                             >
                               <Plus size={16} strokeWidth={2.5} />
                             </button>
                           </div>
                           <span className="w-16 text-right font-black text-rose-800 text-sm">{currentTenant.currency}{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t mt-6 pt-4 flex justify-between items-center text-lg font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-rose-600">{currentTenant.currency}{cartTotal.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50 flex gap-3">
                 <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
                 >
                   Back
                 </button>
                 <button 
                  onClick={async () => {
                    await createAndSubmitOrder();
                    setIsPreviewModalOpen(false);
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                 >
                   Save Order
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {isAddingTableModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Manage Tables</h3>
                <p className="text-sm text-slate-500 mb-6">Add or remove restaurant tables.</p>
                
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    placeholder="e.g., T1, VIP-1"
                    value={newTableNameInput}
                    onChange={(e) => setNewTableNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTableNameInput.trim()) {
                        const name = newTableNameInput.trim();
                        addTable({ id: `tbl-${Date.now()}`, name, isActive: true });
                        setNewTableNum(name);
                        setNewTableNameInput("");
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (newTableNameInput.trim()) {
                        const name = newTableNameInput.trim();
                        addTable({ id: `tbl-${Date.now()}`, name, isActive: true });
                        setNewTableNum(name);
                        setNewTableNameInput("");
                      }
                    }}
                    disabled={!newTableNameInput.trim()}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                  >
                    Add
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 mb-6 custom-scrollbar">
                  {tables.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">No tables created yet.</p>
                  ) : (
                    tables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <span className="text-sm font-bold text-slate-700">{table.name}</span>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete table "${table.name}"?`)) {
                              deleteTable(table.id);
                              if (newTableNum === table.name) setNewTableNum("");
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button 
                    onClick={() => { setIsAddingTableModalOpen(false); setNewTableNameInput(""); }}
                    className="flex-1 px-4 py-4 sm:py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
