
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, OrderItem, Order, OrderStatus, Role } from '../types';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChefHat, 
  Send, 
  FileText, 
  Hash, 
  LayoutGrid, 
  ArrowLeft, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  X, 
  ArrowRight, 
  ShoppingBasket,
  Search,
  Clock,
  ChevronRight,
  Printer,
  Utensils,
  Bluetooth,
  Trash2,
  ListTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BluetoothPrinterService } from '../services/printerService';


const ItemSummary = ({ cart, cartTotal, currency }: { cart: OrderItem[], cartTotal: number, currency: string }) => {
  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (item.status === OrderStatus.CANCELLED) return acc;
      const status = item.status || OrderStatus.PENDING;
      const existing = acc.find(i => i.itemId === item.itemId && i.status === status);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item, status });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  };

  return (
    <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm mb-4">
      <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Item Summary</h3>
      <div className="space-y-1.5">
        {groupItems(cart).map((item, i) => (
          <div key={i} className="flex justify-between text-[10px] gap-2 leading-tight">
            <span className="font-medium text-slate-700 break-words flex-1 line-clamp-2 capitalize tracking-tight">{item.quantity} x {item.name}</span>
            <span className="font-bold text-slate-900 shrink-0">{currency}{(item.price * item.quantity) % 1 === 0 ? (item.price * item.quantity).toFixed(0) : (item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-900">Total</span>
        <span className="text-sm font-bold text-slate-900">{currency}{cartTotal % 1 === 0 ? cartTotal.toFixed(0) : cartTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

const POSCartContent = ({ 
  onClose, 
  isEmbedded = false,
  isCreatingNew,
  newTableNum,
  selectedOrderId,
  orders,
  cartCount,
  currentUser,
  orderType,
  cart,
  updateQuantity,
  orderNote,
  setOrderNote,
  isNoteEditable,
  setIsNoteEditable,
  currentTenant,
  cartTotal,
  createAndSubmitOrder,
  isTokenDuplicate,
  isSubmitting,
  printKOT,
  newTokenNum
}: { 
  onClose?: () => void, 
  isEmbedded?: boolean,
  isCreatingNew: boolean,
  newTableNum: string,
  selectedOrderId: string | null,
  orders: Order[],
  cartCount: number,
  currentUser: any,
  orderType: string,
  cart: OrderItem[],
  updateQuantity: (rowId: string, delta: number) => void,
  orderNote: string,
  setOrderNote: (val: string) => void,
  isNoteEditable: boolean,
  setIsNoteEditable: (val: boolean) => void,
  currentTenant: any,
  cartTotal: number,
  createAndSubmitOrder: () => void,
  isTokenDuplicate: boolean,
  isSubmitting: boolean,
  printKOT: (overrideToken?: string, overrideTable?: string, overrideCreatorName?: string, overrideItems?: OrderItem[], overrideNote?: string) => void,
  newTokenNum: string
}) => (
  <div className={`flex flex-col ${isEmbedded ? 'h-auto rounded-[2rem] border-2' : 'h-full border-l-2'} bg-white border-indigo-500 shadow-2xl shadow-indigo-100 overflow-hidden`}>
    <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <ShoppingBasket size={20} className="text-indigo-500" /> {isEmbedded ? 'Current Selection' : 'Order Basket'}
          </h2>
          {isCreatingNew ? (
            <div className="flex flex-col gap-1 mt-1 ml-8">
              {newTableNum && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Table: {newTableNum}
                </span>
              )}
              {newTokenNum && (
                <div className="flex items-center gap-2 mt-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
                  <Hash size={12} className="text-indigo-500" />
                  <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                    Token: #{newTokenNum}
                  </span>
                </div>
              )}
            </div>
          ) : (
            selectedOrderId && (
              <div className="flex flex-col gap-1 mt-1 ml-8">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Table: {orders.find(o => o.id === selectedOrderId)?.tableNumber || 'N/A'}
                  </span>
                  <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Hash size={12} className="text-indigo-500" />
                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                      Token: #{orders.find(o => o.id === selectedOrderId)?.tokenNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
            {cartCount} Items
          </span>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium">Review selection before processing</p>
    </div>

    <div className={`${isEmbedded ? 'h-auto' : 'flex-1 overflow-y-auto'} p-6 md:p-8 space-y-4 no-scrollbar`}>
      <AnimatePresence mode="popLayout">
        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-slate-300"
          >
              <ShoppingCart size={48} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Basket is empty</p>
          </motion.div>
        ) : (
              cart.map(item => {
                const isExisting = (item as any).isExisting;
                const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
                const canUpdate = (!isExisting || isAdmin) && currentUser?.role !== Role.KITCHEN;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.rowId} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all group shadow-sm"
                  >
                    <div className="min-w-0 pr-2 flex-1">
                        <h4 className="font-bold text-slate-900 text-[11px] leading-tight break-words line-clamp-2 capitalize tracking-tight">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentTenant.currency}{item.price % 1 === 0 ? item.price.toFixed(0) : item.price.toFixed(2)}</p>
                          {isExisting && (
                            <span className="text-[7px] font-black bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded uppercase tracking-tighter">Existing</span>
                          )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100 group-hover:bg-white transition-colors shrink-0">
                        <button 
                          onClick={() => updateQuantity(item.rowId, -1)} 
                          disabled={!canUpdate}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${canUpdate ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'opacity-20 cursor-not-allowed text-slate-300'}`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-xs w-6 text-center text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.rowId, 1)} 
                          disabled={!canUpdate}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${canUpdate ? 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500' : 'opacity-20 cursor-not-allowed text-slate-300'}`}
                        >
                          <Plus size={12} />
                        </button>
                    </div>
                  </motion.div>
                );
              })
        )}
      </AnimatePresence>
    </div>

    <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 shrink-0 space-y-6">
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
          <FileText size={12} /> Kitchen Notes
        </label>
        <textarea 
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Special instructions..."
          className="w-full p-4 bg-white border-2 border-indigo-500 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100 h-24 resize-none"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-[10px] text-slate-400 tracking-widest">Total Amount</span>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{currentTenant.currency}{cartTotal % 1 === 0 ? cartTotal.toFixed(0) : cartTotal.toFixed(2)}</span>
        </div>

        <button 
          onClick={createAndSubmitOrder}
          disabled={cart.length === 0 || (isCreatingNew && !newTokenNum.trim()) || (isCreatingNew && orderType === 'Dine In' && !newTableNum.trim()) || isSubmitting}
          className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 border-2 ${isTokenDuplicate ? 'bg-amber-500 text-white border-amber-600 shadow-amber-100' : 'bg-slate-900 text-white hover:bg-slate-800 border-indigo-500 shadow-indigo-100'}`}
        >
          {isSubmitting ? 'Processing...' : (isCreatingNew ? (isTokenDuplicate ? 'Auto-Resolve & Send' : (!newTokenNum.trim() ? 'Token Required' : (orderType === 'Dine In' && !newTableNum.trim() ? 'Table Required' : 'Send to Kitchen'))) : 'Update Order')} <ArrowRight size={18} />
        </button>
        <button 
          onClick={() => printKOT(undefined, undefined, undefined, undefined, orderNote)}
          disabled={cart.length === 0}
          className="w-14 py-4 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 flex items-center justify-center shadow-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30"
          title="Print KOT"
        >
          <Printer size={20} />
        </button>
      </div>
    </div>
  </div>
);

export const POS = () => {
  const { menu, currentTenant, currentUser, addOrder, updateOrderItems, updateOrderPaymentStatus, orders, users, isLoading, categories, tables, addTable, deleteTable, createPrintRequest, getNextToken } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Select Categories');
  const [orderNote, setOrderNote] = useState('');
  const [isNoteEditable, setIsNoteEditable] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTokenNum, setNewTokenNum] = useState('');
  const [newTableNum, setNewTableNum] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState('Dine In');
  const isDelivery = orderType === 'Online Delivery';
  const isTakeAway = orderType === 'Take Away';
  const [selectedDeliveryStaffId, setSelectedDeliveryStaffId] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'done' | 'paid'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingTableModalOpen, setIsAddingTableModalOpen] = useState(false);
  const [newTableNameInput, setNewTableNameInput] = useState('');

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    console.log('[POS] Component Mounted/Updated', { 
      isLoading, 
      hasTenant: !!currentTenant, 
      hasUser: !!currentUser,
      tenantId: currentTenant?.id,
      userId: currentUser?.id,
      menuLength: menu.length,
      ordersLength: orders.length
    });
  }, [isLoading, currentTenant, currentUser, menu.length, orders.length]);

  if (isLoading || !currentTenant || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Terminal...</p>
        </div>
      </div>
    );
  }

  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (item.status === OrderStatus.CANCELLED) return acc;
      const status = item.status || OrderStatus.PENDING;
      const existing = acc.find(i => i.itemId === item.itemId && i.status === status);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item, status });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  };

  const deliveryStaff = useMemo(() => {
    return users.filter(u => u.role === Role.DELIVERY);
  }, [users]);

  const totalActiveOrdersCount = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    const canSeeAll = currentUser && [Role.OWNER, Role.MANAGER, Role.KITCHEN, Role.SUPER_ADMIN].includes(currentUser.role);
    if (!canSeeAll && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }
    return filtered.length;
  }, [orders, currentUser]);

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    
    // Only Owner, Manager, Kitchen, and Super Admin can see all orders
    const canSeeAll = currentUser && [Role.OWNER, Role.MANAGER, Role.KITCHEN, Role.SUPER_ADMIN].includes(currentUser.role);
    
    if (!canSeeAll && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }
    
    if (filter === 'pending') {
      filtered = filtered.filter(o => (o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING) && !o.isPaid);
    } else if (filter === 'done') {
      filtered = filtered.filter(o => o.status === OrderStatus.READY && !o.isPaid);
    } else if (filter === 'paid') {
      filtered = filtered.filter(o => o.isPaid === true);
    }
    
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return filter === 'pending' ? timeA - timeB : timeB - timeA;
    });
  }, [orders, currentUser, filter]);

  const isTokenDuplicate = useMemo(() => {
    return isCreatingNew && orders.some(o => {
      const timezone = currentTenant?.timezone || 'UTC';
      const todayFormat = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const today = todayFormat.format(new Date());
      const orderDate = new Date(o.createdAt);
      const orderDay = todayFormat.format(orderDate);
      
      return orderDay === today && o.tokenNumber === newTokenNum && o.status !== OrderStatus.CANCELLED;
    });
  }, [isCreatingNew, orders, newTokenNum, currentTenant]);

  const activeOrdersTotal = useMemo(() => {
    return activeOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [activeOrders]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(activeOrders.length / itemsPerPage);
  const paginatedOrders = activeOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getWaiterName = (userId: string) => {
    if (userId === currentUser?.id) return currentUser?.name || 'Staff';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getStatusStyles = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', dot: 'bg-pink-500', topBorder: 'bg-pink-500' };
      case OrderStatus.PREPARING: 
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500', topBorder: 'bg-blue-500' };
      case OrderStatus.READY: 
      case OrderStatus.COMPLETED:
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500', topBorder: 'bg-emerald-500' };
      case OrderStatus.CANCELLED:
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500', topBorder: 'bg-red-500' };
      default: 
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500', topBorder: 'bg-slate-500' };
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    // Mark existing items so we don't merge new additions into them
    setCart(order.items.map(item => ({ ...item, isExisting: true } as any)));
    setOrderNote(order.note || '');
    setOrderType(order.deliveryStaffId ? 'Online Delivery' : (order.tableNumber === 'Take Away' ? 'Take Away' : 'Dine In'));
    setSelectedDeliveryStaffId(order.deliveryStaffId || '');
    setDeliveryAddress(order.deliveryAddress || '');
    setIsCreatingNew(false);
  };

  const startNewOrder = () => {
    const nextToken = getNextToken();
    setNewTokenNum(nextToken);
    setNewTableNum('');
    setIsCreatingNew(true);
    setSelectedOrderId(null);
    setCart([]);
    setOrderNote('');
    setOrderType('Dine In');
    setSelectedDeliveryStaffId('');
    setDeliveryAddress('');
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) return;
    
    setCart(prev => {
      // Find if this item is already in the cart AND it's a "new" item (not from an existing order)
      const existingNewItemIndex = prev.findIndex(i => 
        i.itemId === item.id && 
        i.status === OrderStatus.PENDING && 
        !(i as any).isExisting
      );

      if (existingNewItemIndex > -1) {
        const currentQty = prev[existingNewItemIndex].quantity;
        if (item.stock !== undefined && item.stock !== null && currentQty >= item.stock) {
          return prev; // Don't add if stock limit reached
        }
        const newCart = [...prev];
        newCart[existingNewItemIndex] = {
          ...newCart[existingNewItemIndex],
          quantity: currentQty + 1
        };
        return newCart;
      }

      return [
        ...prev, 
        { 
          rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id, 
          name: item.name, 
          quantity: 1, 
          price: item.price,
          status: OrderStatus.PENDING 
        }
      ];
    });
  };

  const updateQuantity = (rowId: string, delta: number) => {
    const isAdmin = currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN;
    
    setCart(prev => prev.map(i => {
      if (i.rowId === rowId) {
        // Restrict editing existing items for non-admins
        if ((i as any).isExisting && !isAdmin) return i;
        
        const menuItem = menu.find(m => m.id === i.itemId);
        const newQty = i.quantity + delta;
        
        // Check stock if increasing
        if (delta > 0 && menuItem && menuItem.stock !== undefined && menuItem.stock !== null) {
          if (newQty > menuItem.stock) return i;
        }
        
        return { ...i, quantity: Math.max(0, newQty) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const createAndSubmitOrder = async () => {
    console.log('createAndSubmitOrder triggered', { cartLength: cart.length, isSubmitting, isCreatingNew, newTokenNum, isTokenDuplicate });
    if (cart.length === 0 || isSubmitting) {
      console.log('Early return from createAndSubmitOrder', { cartLength: cart.length, isSubmitting });
      return;
    }
    setIsSubmitting(true);

    try {
      setErrorMessage(null);
      if (isCreatingNew) {
        let finalTokenNum = newTokenNum;
        if (isTokenDuplicate) {
          console.log('Token is duplicate, auto-resolving to next available token...');
          finalTokenNum = getNextToken();
        }

        const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Clean up the isExisting flag before saving
        const cleanedItems = cart.map(({ isExisting, ...item }: any) => item);
        
        const selectedStaff = deliveryStaff.find(s => s.id === selectedDeliveryStaffId);
        
        const newOrder = {
          id: `ord-${Date.now()}`,
          tokenNumber: finalTokenNum,
          tableNumber: isDelivery ? 'Delivery' : (isTakeAway ? 'Take Away' : newTableNum),
          items: cleanedItems,
          status: OrderStatus.PENDING,
          createdAt: new Date().toISOString(),
          createdBy: currentUser!.id,
          creatorName: currentUser?.name || currentUser?.email?.split('@')[0] || 'Staff',
          totalAmount,
          note: orderNote,
          deliveryStaffId: isDelivery ? selectedDeliveryStaffId : null,
          deliveryStaffName: isDelivery ? (selectedStaff?.name || null) : null,
          deliveryStaffMobile: isDelivery ? (selectedStaff?.mobile || null) : null,
          deliveryAddress: isDelivery ? (deliveryAddress || null) : null
        };
        await addOrder(newOrder);

        const printToken = finalTokenNum;
        const printTable = isDelivery ? 'Delivery' : (isTakeAway ? 'Take Away' : newTableNum);
        const printCreator = currentUser?.name;
        const printNote = orderNote;

        // Clear UI form state *before* blocking print dialog
        setSelectedOrderId(null);
        setIsCreatingNew(false);
        setCart([]);
        setOrderNote('');
        setNewTableNum('');
        setOrderType('Dine In');
        setSelectedDeliveryStaffId('');
        setDeliveryAddress('');

        // Auto-print KOT if enabled (Handled by addOrder in AppContext)
        if (!currentTenant?.printerSettings?.enablePrintAgent && currentTenant?.printerSettings?.autoPrintKOT) {
          try {
            await printKOT(printToken, printTable, printCreator, cleanedItems, printNote);
          } catch (err) {
            console.error('Auto-print KOT failed:', err);
            setErrorMessage('Auto-print KOT failed. Please check printer connection.');
          }
        }
      } else if (selectedOrderId) {
        const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Check if new items were added to reset status to PENDING
        const newItems = cart.filter((i: any) => !i.isExisting);
        const hasNewItems = newItems.length > 0;
        
        // Clean up the isExisting flag before saving
        const cleanedItems = cart.map(({ isExisting, ...item }: any) => item);
        
        const selectedStaff = deliveryStaff.find(s => s.id === selectedDeliveryStaffId);

        await updateOrderItems(
          selectedOrderId, 
          cleanedItems, 
          totalAmount, 
          orderNote, 
          hasNewItems ? OrderStatus.PENDING : null,
          isDelivery ? selectedDeliveryStaffId : null,
          isDelivery ? (selectedStaff?.name || null) : null,
          isDelivery ? (selectedStaff?.mobile || null) : null,
          isDelivery ? (deliveryAddress || null) : null
        );
        
        // Save these for print before clearing
        const oldOrder = orders.find(o => o.id === selectedOrderId);
        const printToken = oldOrder?.tokenNumber || '';
        const printTable = oldOrder?.tableNumber || '';
        const printCreator = currentUser?.name;
        const printNote = orderNote;

        // Clear UI form state *before* blocking print dialog
        setSelectedOrderId(null);
        setIsCreatingNew(false);
        setCart([]);
        setOrderNote('');
        setNewTableNum('');
        setOrderType('Dine In');
        setSelectedDeliveryStaffId('');
        setDeliveryAddress('');

        // Auto-print logic for updates is now handled centrally in AppContext.tsx
        // but if we are using the browser print, it requires local DOM
        if (!currentTenant?.printerSettings?.enablePrintAgent && hasNewItems && currentTenant?.printerSettings?.autoPrintKOT) {
          // Print only new items
          try {
            await printKOT(printToken, printTable, printCreator, newItems, printNote);
          } catch (err) {
            console.error('Auto-print KOT failed:', err);
            setErrorMessage('Auto-print KOT failed. Please check printer connection.');
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to submit order:', error);
      let msg = 'Unknown error';
      try {
        const parsed = JSON.parse(error.message);
        msg = parsed.error || error.message;
      } catch {
        msg = error.message || 'Unknown error';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenu = useMemo(() => {
    if (!activeCategory || activeCategory === 'Select Categories') return [];
    return menu.filter(m => {
      const matchesCategory = m.category === activeCategory;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, activeCategory, searchTerm]);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const printKOT = async (overrideToken?: string, overrideTable?: string, overrideCreatorName?: string, overrideItems?: OrderItem[], overrideNote?: string) => {
    const token = overrideToken || (isCreatingNew ? newTokenNum : orders.find(o => o.id === selectedOrderId)?.tokenNumber);
    const table = overrideTable || (isCreatingNew ? (isDelivery ? 'Delivery' : (isTakeAway ? 'Take Away' : newTableNum)) : orders.find(o => o.id === selectedOrderId)?.tableNumber);
    const creatorId = isCreatingNew ? currentUser?.id : orders.find(o => o.id === selectedOrderId)?.createdBy;
    const creatorName = overrideCreatorName || (creatorId ? getWaiterName(creatorId) : 'Staff');
    const itemsToPrint = overrideItems || cart;
    const noteToPrint = overrideNote !== undefined ? overrideNote : orderNote;

    const orderData = {
      id: selectedOrderId || 'manual-' + Date.now(),
      tenantId: currentTenant.id,
      tokenNumber: token || '000',
      tableNumber: table,
      items: itemsToPrint,
      note: noteToPrint,
      createdAt: new Date().toISOString(),
      creatorName: creatorName,
      totalAmount: itemsToPrint.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    if (currentTenant?.printerSettings?.enablePrintAgent) {
      try {
        await createPrintRequest(orderData as any, 'kot');
        return;
      } catch (error) {
        console.error('Print Agent KOT failed:', error);
      }
    }

    // If a bluetooth printer is paired, try to print directly
    if (currentTenant?.printerSettings?.pairedPrinterId) {
      try {
        const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
        if (result.success) {
          const orderData = {
            tokenNumber: token || '000',
            tableNumber: table,
            items: itemsToPrint,
            note: noteToPrint,
            createdAt: new Date().toISOString(),
            creatorName: creatorName
          };
          await BluetoothPrinterService.printKOT(currentTenant, orderData as any);
          
          if (currentTenant.printerSettings?.autoMarkReadyOnPrint && selectedOrderId) {
            updateOrderStatus(selectedOrderId, OrderStatus.READY);
          }
          
          return; // Skip system print if bluetooth worked
        } else if (result.error === 'unsupported') {
          console.warn('Bluetooth is not supported or blocked in this environment. Using automatic printer agent instead.');
          // We don't show an error message here because the automatic agent will handle it
        } else if (result.error === 'failed') {
          setErrorMessage('Bluetooth printer connection failed. Please check if the printer is on and paired.');
        }
      } catch (error) {
        console.error('Bluetooth KOT print failed, falling back to system print:', error);
      }
    }

    // Note: System print might need adjustment to handle overrideItems if it relies on DOM
    const printContent = document.getElementById('kot-content');
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `KOT - #${token}`;
    
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Apply paper width setting
    const paperWidth = currentTenant?.printerSettings?.paperWidth || '80mm';
    printContainer.style.width = paperWidth;
    printContainer.style.margin = '0 auto';
    
    // Update the DOM elements with the correct values before printing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent.innerHTML;
    
    const tokenEl = tempDiv.querySelector('.kot-token');
    if (tokenEl) tokenEl.textContent = `Token: #${token}`;
    
    const tableEl = tempDiv.querySelector('.kot-table');
    if (tableEl) tableEl.textContent = `Table: ${table}`;
    
    const waiterEl = tempDiv.querySelector('.kot-waiter');
    if (waiterEl) waiterEl.textContent = `Waiter: ${creatorName}`;

    // Update note dynamically
    const noteContainerEl = tempDiv.querySelector('.kot-note-container') as HTMLElement;
    const noteContentEl = tempDiv.querySelector('.kot-note');
    if (noteContainerEl && noteContentEl) {
        if (noteToPrint) {
            noteContainerEl.style.display = 'block';
            noteContentEl.textContent = noteToPrint;
        } else {
            noteContainerEl.style.display = 'none';
        }
    }

    // Overwrite items list dynamically to prevent stale data
    const itemsContainer = tempDiv.querySelector('.kot-items-container');
        if (itemsContainer && itemsToPrint) {
            itemsContainer.innerHTML = '';
            const grouped = groupItems(itemsToPrint as any);
            grouped.forEach((item: any) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex justify-between items-start text-xl font-black';
                itemDiv.innerHTML = `<span class="text-black">x${item.quantity} ${item.name}</span>`;
                itemsContainer.appendChild(itemDiv);
            });
        }

    printContainer.innerHTML = tempDiv.innerHTML;
    document.body.appendChild(printContainer);

    // Wait briefly to allow DOM to update, then trigger print
    await new Promise(resolve => setTimeout(resolve, 100));

    window.focus();
    window.print();
    
    // Clean up
    document.body.removeChild(printContainer);
    document.title = originalTitle;
  };

  if (!selectedOrderId && !isCreatingNew) {
    return (
      <div className="p-4 md:p-10 h-full bg-slate-50/50 overflow-y-auto no-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center gap-10 mb-8 md:mb-12">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1a37] flex items-center justify-center shadow-xl shrink-0">
                <LayoutGrid className="text-indigo-500" size={24} />
            </div>
            <div className="min-w-fit">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Active Terminals</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {currentUser?.role === Role.WAITER ? 'Your active service tokens' : 'Global floor tracking & management'}
                </p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto ml-1 md:ml-0">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full md:w-auto">
            <button 
              onClick={() => setFilter('pending')}
              className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('done')}
              className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'done' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Done
            </button>
            <button 
              onClick={() => setFilter('paid')}
              className={`flex-1 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'paid' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Paid
            </button>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-rose-100 px-5 py-2.5 rounded-2xl border-2 border-rose-200 shadow-sm flex flex-col items-center justify-center min-w-[90px]">
              <span className="text-[7px] font-black uppercase tracking-widest text-rose-800 mb-0.5">Orders</span>
              <span className="text-rose-900 text-xs font-black leading-none">{activeOrders.length}</span>
            </div>
            <div className="flex-1 md:flex-none bg-indigo-100 px-5 py-2.5 rounded-2xl border-2 border-indigo-200 shadow-sm flex flex-col items-center justify-center min-w-[110px]">
              <span className="text-[7px] font-black uppercase tracking-widest text-indigo-800 mb-0.5">Total</span>
              <span className="text-indigo-900 text-xs font-black leading-none">{currentTenant?.currency}{activeOrdersTotal.toFixed(0)}</span>
            </div>
          </div>

          <button 
            onClick={startNewOrder}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-indigo-500 w-full md:w-auto h-[52px] shrink-0"
          >
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-6">
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map(order => {
              const hasPending = order.items.some(i => i.status === OrderStatus.PENDING);
              const hasPreparing = order.items.some(i => i.status === OrderStatus.PREPARING);
              
              const derivedStatus = hasPending 
                ? OrderStatus.PENDING 
                : (hasPreparing ? OrderStatus.PREPARING : order.status);
                
              const statusStyles = getStatusStyles(derivedStatus);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className="group relative bg-white rounded-[2.5rem] shadow-2xl border-4 border-black transition-all duration-300 text-left flex flex-col min-h-[280px] hover:scale-[1.02] overflow-hidden cursor-pointer"
                >
                  {/* Top Border Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-4 ${statusStyles.topBorder}`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full p-6 pt-10">
                    {/* Token Number Pill */}
                    <div className="flex justify-center mb-6 relative">
                      <div className={`w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-black text-lg text-white shadow-xl ${statusStyles.topBorder}`}>
                        {order.tokenNumber}
                      </div>
                      {(order.tableNumber || order.deliveryStaffName) && (
                        <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">
                          {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                        </div>
                      )}
                      {/* Paid/Unpaid Status Dropdown */}
                      <div className="absolute -top-2 -left-2 bg-white rounded-full border-2 border-black shadow-lg uppercase">
                        <select
                          value={order.isPaid ? 'paid' : 'unpaid'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateOrderPaymentStatus(order.id, e.target.value === 'paid');
                            console.log('Toggle payment status to:', e.target.value);
                          }}
                          className="text-[9px] font-black px-2 py-0.5 rounded-full bg-transparent outline-none cursor-pointer"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                    </div>

                    {order.deliveryStaffName && (
                      <div className="mb-4 text-center">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{order.deliveryStaffName}</p>
                        {order.deliveryStaffMobile && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{order.deliveryStaffMobile}</p>}
                      </div>
                    )}

                    {/* Items Summary List */}
                    <div className="mb-4 space-y-1">
                      {(() => {
                        const groupedItems: { [key: string]: { name: string, quantity: number, status: OrderStatus } } = {};
                        order.items.forEach(item => {
                          const status = item.status || OrderStatus.PENDING;
                          const key = `${item.itemId}-${status}`;
                          if (!groupedItems[key]) {
                            groupedItems[key] = { name: item.name, quantity: 0, status: status as OrderStatus };
                          }
                          groupedItems[key].quantity += item.quantity;
                        });
                        return Object.entries(groupedItems).map(([key, group]) => {
                          const itemStyles = getStatusStyles(group.status);
                          return (
                            <div key={key} className={`flex justify-between items-center text-[10px] font-bold capitalize tracking-widest px-2 py-0.5 rounded-md border-2 ${itemStyles.bg} ${itemStyles.topBorder.replace('bg-', 'border-')}`}>
                              <span className={`${itemStyles.text} ${group.status === OrderStatus.READY || group.status === OrderStatus.COMPLETED || group.status === OrderStatus.CANCELLED ? 'line-through opacity-50' : ''}`}>{group.name}</span>
                              <span className={itemStyles.text}>x{group.quantity}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Dashed Divider */}
                    <div className="border-t-2 border-dashed border-slate-200 mb-6"></div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{getWaiterName(order.createdBy).split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === OrderStatus.READY && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const orderData = { ...order, creatorName: getWaiterName(order.createdBy) };
                              
                              if (currentTenant?.printerSettings?.enablePrintAgent) {
                                try {
                                  await createPrintRequest(orderData as any, 'invoice');
                                } catch (error) {
                                  console.error('Print Agent failed:', error);
                                  setErrorMessage('Cloud print failed. Please check Print Agent status.');
                                }
                              } else if (currentTenant?.printerSettings?.pairedPrinterId) {
                                try {
                                  const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
                                  if (result.success) {
                                    await BluetoothPrinterService.printInvoice(currentTenant, order, { 
                                      creatorName: getWaiterName(order.createdBy)
                                    });
                                  } else {
                                    setErrorMessage('Bluetooth printer connection failed. Please check if the printer is on and paired.');
                                  }
                                } catch (error) {
                                  console.error('Bluetooth print failed:', error);
                                  setErrorMessage('Failed to print invoice. Please check printer connection.');
                                }
                              } else {
                                setErrorMessage('No printer configured. Enable Print Agent or pair a Bluetooth printer in Settings.');
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-90"
                            title="Print Invoice"
                          >
                            <Printer size={18} />
                          </button>
                        )}
                        <div className="bg-black text-white px-4 py-2 rounded-full font-black text-sm flex items-center gap-1 shadow-lg">
                          <span className="text-[10px] opacity-60">{currentTenant?.currency}</span>
                          {order.totalAmount.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {activeOrders.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">No active orders</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pb-12">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50/50 h-[calc(100vh-64px)] md:h-full overflow-y-auto lg:overflow-hidden no-scrollbar">
      <div className="flex-none lg:flex-1 flex flex-col min-w-0 lg:overflow-hidden border-r border-slate-100">
        {/* Error Message Modal */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
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
                <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
                  {errorMessage}
                </p>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Dismiss
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* POS Header */}
        <div className="p-4 md:p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="flex items-start md:items-center gap-3 md:gap-6 w-full md:w-auto">
              <button 
                onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-90 shrink-0 mt-1 md:mt-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 md:gap-4 flex-wrap">
                  {isCreatingNew ? 'New Order Terminal' : `Token #${activeOrders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
                  <span className="text-[9px] md:text-xs font-medium text-slate-400 bg-slate-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                    Active: {totalActiveOrdersCount}
                  </span>
                </h2>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-2 ${isCreatingNew ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3 w-full`}>
            {isCreatingNew && (
              <>
                <div className="flex items-center gap-2 md:gap-3 bg-indigo-50 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-indigo-500 w-full">
                  <span className="text-[10px] md:text-[11px] text-indigo-800 font-black uppercase tracking-widest">Token:</span>
                  <input 
                    type="text" 
                    value={newTokenNum}
                    onChange={(e) => setNewTokenNum(e.target.value)}
                    className={`flex-1 min-w-0 w-full text-center border-b-2 bg-transparent font-black text-sm md:text-lg outline-none transition-all ${isTokenDuplicate ? 'border-rose-500 text-rose-600' : 'border-indigo-500 text-indigo-900'}`}
                  />
                  {isTokenDuplicate && <AlertCircle className="text-rose-500 shrink-0" size={14} />}
                </div>
                
                <div className="relative w-full">
                  <select 
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full pl-4 pr-8 py-2.5 md:py-3 bg-white border-2 border-indigo-500 rounded-xl md:rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100 appearance-none cursor-pointer"
                  >
                    <option value="Dine In">Dine In</option>
                    <option value="Take Away">Take Away</option>
                    <option value="Online Delivery">Online Delivery</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 rotate-90 pointer-events-none" size={16} />
                </div>

                {orderType === 'Dine In' && (
                  <div className="flex items-center gap-2 md:gap-3 bg-slate-50 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-slate-900 w-full">
                    <select 
                      value={newTableNum}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingTableModalOpen(true);
                          setNewTableNum(''); // Reset temporarily while modal is open
                        } else {
                          setNewTableNum(e.target.value);
                        }
                      }}
                      className="flex-1 min-w-0 w-full text-left bg-transparent font-black text-xs md:text-sm outline-none transition-all text-slate-900"
                    >
                      <option value="" disabled>Select Table</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                      {(currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN) && (
                        <option value="__ADD_NEW__" className="font-bold text-indigo-600">⚙ Manage Tables</option>
                      )}
                    </select>
                  </div>
                )}
              </>
            )}
            
            {!isCreatingNew && (
                <div className="relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search menu..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-white border-2 border-indigo-500 rounded-xl md:rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100"
                    />
                </div>
            )
            }

            <div className="relative w-full">
              <select 
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full pl-2 pr-6 py-3 bg-white border-2 border-black rounded-xl text-xs font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-sm"
              >
                <option value="Select Categories" className="text-sm">Select Categories</option>
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat} className="text-sm uppercase">{cat}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-12 lg:pb-32">
          {activeCategory !== 'Select Categories' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredMenu.map(item => (
                  <motion.button 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className={`group bg-white rounded-[1.5rem] border-2 border-black p-3 flex flex-col hover:border-indigo-500 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all active:scale-95 relative overflow-hidden hover:-translate-y-1`}
                  >
                    <div className="text-center flex flex-col items-center justify-center h-full">
                      <div className="mb-2">
                        <h4 className="font-black text-slate-900 text-[11px] capitalize tracking-tight group-hover:text-indigo-600 transition-colors mb-1">{item.name}</h4>
                        <span className="text-[14px] font-black text-indigo-600">{currentTenant.currency}{item.price.toFixed(0)}</span>
                      </div>
                      
                      <div className="flex items-center justify-center mt-auto w-full">
                        <div className="flex flex-col items-center">
                          {item.stock !== undefined && item.stock !== null && (
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${item.stock <= 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                              Stock: {item.stock}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${item.stock !== undefined && item.stock !== null && item.stock <= 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white group-hover:bg-indigo-600 group-hover:scale-110 shadow-lg'}`}>
                        {item.stock !== undefined && item.stock !== null && item.stock <= 0 ? <X size={12} /> : <Plus size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
          {activeCategory !== 'Select Categories' && filteredMenu.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <Search size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">
                  No items found
                </p>
            </div>
          )}

          {/* Mobile Embedded Basket - Visible below menu items */}
          <div className={`lg:hidden ${activeCategory !== 'Select Categories' ? 'mt-12' : 'mt-4'} mb-20`}>
            <POSCartContent 
              isEmbedded 
              isCreatingNew={isCreatingNew}
              newTableNum={newTableNum}
              selectedOrderId={selectedOrderId}
              orders={orders}
              cartCount={cartCount}
              currentUser={currentUser}
              orderType={orderType}
              cart={cart}
              updateQuantity={updateQuantity}
              orderNote={orderNote}
              setOrderNote={setOrderNote}
              isNoteEditable={isNoteEditable}
              setIsNoteEditable={setIsNoteEditable}
              currentTenant={currentTenant}
              cartTotal={cartTotal}
              createAndSubmitOrder={createAndSubmitOrder}
              isTokenDuplicate={isTokenDuplicate}
              isSubmitting={isSubmitting}
              printKOT={printKOT}
              newTokenNum={newTokenNum}
            />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar Basket */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-white flex-col shadow-2xl shrink-0">
         <POSCartContent 
            isCreatingNew={isCreatingNew}
            newTableNum={newTableNum}
            selectedOrderId={selectedOrderId}
            orders={orders}
            cartCount={cartCount}
            currentUser={currentUser}
            orderType={orderType}
            cart={cart}
            updateQuantity={updateQuantity}
            orderNote={orderNote}
            setOrderNote={setOrderNote}
            isNoteEditable={isNoteEditable}
            setIsNoteEditable={setIsNoteEditable}
            currentTenant={currentTenant}
            cartTotal={cartTotal}
            createAndSubmitOrder={createAndSubmitOrder}
            isTokenDuplicate={isTokenDuplicate}
            isSubmitting={isSubmitting}
            printKOT={printKOT}
            newTokenNum={newTokenNum}
         />
      </div>

      {/* KOT Print Content (Hidden normally, visible during print) */}
      <div id="kot-content" className="hidden print:block p-4 font-sans print-visible text-black">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <div className="text-[12pt] font-bold">Kitchen Token: #{isCreatingNew ? newTokenNum : orders.find(o => o.id === selectedOrderId)?.tokenNumber}</div>
          <div className="text-[12pt] font-bold">Table No: {isCreatingNew ? (isDelivery ? 'Delivery' : (isTakeAway ? 'Take Away' : newTableNum)) : orders.find(o => o.id === selectedOrderId)?.tableNumber}</div>
          <div className="text-[12pt] font-bold">Ordered by: {isCreatingNew ? currentUser?.name : getWaiterName(orders.find(o => o.id === selectedOrderId)?.createdBy || '')}</div>
          <div className="flex justify-between text-[10pt] font-bold mt-2 border-t border-black pt-1">
            <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
            <span>Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
        
        <div className="space-y-1 mb-4 kot-items-container">
          {groupItems(cart).map((item, i) => (
            <div key={i} className="flex justify-between items-start text-[12pt] font-bold border-b border-dashed border-black pb-1">
              <span className="text-black">{item.quantity} x {item.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-black pt-2 mb-4 kot-note-container" style={{ display: orderNote ? 'block' : 'none' }}>
          <p className="text-[10pt] font-bold uppercase text-black">Note:</p>
          <p className="text-[12pt] font-black italic text-black kot-note">{orderNote}</p>
        </div>

        <div className="text-center border-t-2 border-black pt-4">
          <p className="text-[10pt] font-bold text-black">--- Kitchen Copy ---</p>
        </div>
      </div>

      {/* Mobile Sticky Summary Bar Removed as per request - User can scroll to embedded basket */}

      {/* Mobile Cart Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-md"
            >
              <POSCartContent 
                onClose={() => setIsCartOpen(false)} 
                isCreatingNew={isCreatingNew}
                newTableNum={newTableNum}
                selectedOrderId={selectedOrderId}
                orders={orders}
                cartCount={cartCount}
                currentUser={currentUser}
                orderType={orderType}
                cart={cart}
                updateQuantity={updateQuantity}
                orderNote={orderNote}
                setOrderNote={setOrderNote}
                isNoteEditable={isNoteEditable}
                setIsNoteEditable={setIsNoteEditable}
                currentTenant={currentTenant}
                cartTotal={cartTotal}
                createAndSubmitOrder={createAndSubmitOrder}
                isTokenDuplicate={isTokenDuplicate}
                isSubmitting={isSubmitting}
                printKOT={printKOT}
                newTokenNum={newTokenNum}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {isAddingTableModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
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
                        const tableName = newTableNameInput.trim();
                        addTable({ id: `tbl-${Date.now()}`, name: tableName, isActive: true });
                        setNewTableNum(tableName);
                        setNewTableNameInput('');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newTableNameInput.trim()) {
                        const tableName = newTableNameInput.trim();
                        addTable({ id: `tbl-${Date.now()}`, name: tableName, isActive: true });
                        setNewTableNum(tableName);
                        setNewTableNameInput('');
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
                              if (newTableNum === table.name) setNewTableNum('');
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setIsAddingTableModalOpen(false);
                      setNewTableNameInput('');
                    }}
                    className="flex-1 px-4 py-4 sm:py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
