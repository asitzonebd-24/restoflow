
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
  Bluetooth
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BluetoothPrinterService } from '../services/printerService';

const StatusBadge = ({ label, count, styles }: { label: string, count: number, styles: any, active?: boolean }) => (
  <div className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 transition-all ${count > 0 ? `${styles.bg} ${styles.text.replace('text-', 'border-')} ${styles.text}` : 'bg-slate-50/50 border-slate-100 text-slate-200'}`}>
    <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{label}</span>
    <span className="text-xl font-black">{count}</span>
  </div>
);

const ItemSummary = ({ cart, cartTotal, currency }: { cart: OrderItem[], cartTotal: number, currency: string }) => {
  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const existing = acc.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
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
            <span className="font-medium text-slate-700 break-words flex-1 line-clamp-2 uppercase tracking-tight">{item.quantity} x {item.name}</span>
            <span className="font-bold text-slate-900 shrink-0">{currency}{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-900">Total</span>
        <span className="text-sm font-bold text-slate-900">{currency}{cartTotal.toFixed(2)}</span>
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
  isDelivery,
  setIsDelivery,
  deliveryStaff,
  selectedDeliveryStaffId,
  setSelectedDeliveryStaffId,
  deliveryAddress,
  setDeliveryAddress,
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
  isDelivery: boolean,
  setIsDelivery: (val: boolean) => void,
  deliveryStaff: any[],
  selectedDeliveryStaffId: string,
  setSelectedDeliveryStaffId: (val: string) => void,
  deliveryAddress: string,
  setDeliveryAddress: (val: string) => void,
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
  printKOT: () => void,
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
      {/* Delivery Options */}
      {(currentUser?.role === Role.OWNER || currentUser?.role === Role.MANAGER || currentUser?.role === Role.SUPER_ADMIN) && (
        <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
              <ShoppingBag size={14} /> Online / Delivery Order
            </label>
            <button 
              onClick={() => setIsDelivery(!isDelivery)}
              className={`w-10 h-5 rounded-full transition-all relative ${isDelivery ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDelivery ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          
          {isDelivery && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 overflow-hidden"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Assign Delivery Staff</label>
                <select 
                  value={selectedDeliveryStaffId}
                  onChange={(e) => setSelectedDeliveryStaffId(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="">Select Staff...</option>
                  {deliveryStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Delivery Address</label>
                <input 
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter full address..."
                  className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </motion.div>
          )}
        </div>
      )}

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
                        <h4 className="font-bold text-slate-900 text-[11px] leading-tight break-words line-clamp-2 uppercase tracking-tight">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentTenant.currency}{item.price.toFixed(2)}</p>
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
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{currentTenant.currency}{cartTotal.toFixed(2)}</span>
        </div>

        <button 
          onClick={createAndSubmitOrder}
          disabled={cart.length === 0 || isTokenDuplicate || (isCreatingNew && !newTokenNum.trim()) || (isCreatingNew && !newTableNum.trim() && !isDelivery) || (isDelivery && !selectedDeliveryStaffId) || isSubmitting}
          className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 border-2 ${isTokenDuplicate ? 'bg-rose-500 text-white border-rose-600 shadow-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800 border-indigo-500 shadow-indigo-100'}`}
        >
          {isSubmitting ? 'Processing...' : (isCreatingNew ? (isTokenDuplicate ? 'Duplicate Token' : (!newTokenNum.trim() ? 'Token Required' : (!newTableNum.trim() && !isDelivery ? 'Table Required' : (isDelivery && !selectedDeliveryStaffId ? 'Select Staff' : 'Send to Kitchen')))) : 'Update Order')} <ArrowRight size={18} />
        </button>
        <button 
          onClick={printKOT}
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
  const { menu, currentTenant, currentUser, addOrder, updateOrderItems, orders, users, isLoading, categories, tables, addTable } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [orderNote, setOrderNote] = useState('');
  const [isNoteEditable, setIsNoteEditable] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTokenNum, setNewTokenNum] = useState('');
  const [newTableNum, setNewTableNum] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [selectedDeliveryStaffId, setSelectedDeliveryStaffId] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingTableModalOpen, setIsAddingTableModalOpen] = useState(false);
  const [newTableNameInput, setNewTableNameInput] = useState('');

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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
      const existing = acc.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  };

  const deliveryStaff = useMemo(() => {
    return users.filter(u => u.role === Role.DELIVERY);
  }, [users]);

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    
    // Only Owner, Manager, Kitchen, and Super Admin can see all orders
    const canSeeAll = currentUser && [Role.OWNER, Role.MANAGER, Role.KITCHEN, Role.SUPER_ADMIN].includes(currentUser.role);
    
    if (!canSeeAll && currentUser) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }
    
    if (filter === 'pending') {
      filtered = filtered.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
    } else {
      filtered = filtered.filter(o => o.status === OrderStatus.READY);
    }
    
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return filter === 'pending' ? timeA - timeB : timeB - timeA;
    });
  }, [orders, currentUser, filter]);

  const isTokenDuplicate = useMemo(() => {
    const allActive = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    return isCreatingNew && allActive.some(o => o.tokenNumber === newTokenNum);
  }, [isCreatingNew, orders, newTokenNum]);

  const activeOrdersTotal = useMemo(() => {
    return activeOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [activeOrders]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(activeOrders.length / itemsPerPage);
  const paginatedOrders = activeOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getWaiterName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getStatusStyles = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', dot: 'bg-rose-500', topBorder: 'bg-rose-500' };
      case OrderStatus.PREPARING: 
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500', topBorder: 'bg-amber-500' };
      case OrderStatus.READY: 
      case OrderStatus.COMPLETED:
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500', topBorder: 'bg-emerald-500' };
      default: 
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500', topBorder: 'bg-slate-500' };
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    // Mark existing items so we don't merge new additions into them
    setCart(order.items.map(item => ({ ...item, isExisting: true } as any)));
    setOrderNote(order.note || '');
    setIsDelivery(!!order.deliveryStaffId);
    setSelectedDeliveryStaffId(order.deliveryStaffId || '');
    setDeliveryAddress(order.deliveryAddress || '');
    setIsCreatingNew(false);
  };

  const startNewOrder = () => {
    const allActive = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    const numericTokens = allActive.map(o => parseInt(o.tokenNumber)).filter(n => !isNaN(n));
    const nextToken = numericTokens.length > 0 ? (Math.max(...numericTokens) + 1).toString() : "1";
    setNewTokenNum(nextToken);
    setNewTableNum('');
    setIsCreatingNew(true);
    setSelectedOrderId(null);
    setCart([]);
    setOrderNote('');
    setIsDelivery(false);
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
        if (isTokenDuplicate) {
          console.log('Token is duplicate, aborting');
          setErrorMessage('This token number is already in use for an active order. Please use a different token.');
          setIsSubmitting(false);
          return;
        }
        const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Clean up the isExisting flag before saving
        const cleanedItems = cart.map(({ isExisting, ...item }: any) => item);
        
        const selectedStaff = deliveryStaff.find(s => s.id === selectedDeliveryStaffId);
        
        const newOrder = {
          id: `ord-${Date.now()}`,
          tokenNumber: newTokenNum,
          tableNumber: isDelivery ? 'Delivery' : newTableNum,
          items: cleanedItems,
          status: OrderStatus.PENDING,
          createdAt: new Date().toISOString(),
          createdBy: currentUser!.id,
          totalAmount,
          note: orderNote,
          deliveryStaffId: isDelivery ? selectedDeliveryStaffId : null,
          deliveryStaffName: isDelivery ? (selectedStaff?.name || null) : null,
          deliveryStaffMobile: isDelivery ? (selectedStaff?.mobile || null) : null,
          deliveryAddress: isDelivery ? (deliveryAddress || null) : null
        };
        await addOrder(newOrder);

        // Auto-print KOT if enabled
        if (currentTenant?.printerSettings?.autoPrintKOT) {
          setTimeout(() => {
            printKOT().catch(err => {
              console.error('Auto-print KOT failed:', err);
              setErrorMessage('Auto-print KOT failed. Please check printer connection.');
            });
          }, 500);
        }
      } else if (selectedOrderId) {
        const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Check if new items were added to reset status to PENDING
        const hasNewItems = cart.some((i: any) => !i.isExisting);
        
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
      }

      setSelectedOrderId(null);
      setIsCreatingNew(false);
      setCart([]);
      setOrderNote('');
      setNewTableNum('');
      setIsDelivery(false);
      setSelectedDeliveryStaffId('');
      setDeliveryAddress('');
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
    if (!activeCategory) return [];
    return menu.filter(m => {
      const matchesCategory = m.category === activeCategory;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, activeCategory, searchTerm]);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const printKOT = async () => {
    // If a bluetooth printer is paired, try to print directly
    if (currentTenant?.printerSettings?.pairedPrinterId) {
      try {
        const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
        if (result.success) {
          const token = isCreatingNew ? newTokenNum : orders.find(o => o.id === selectedOrderId)?.tokenNumber;
          const orderData = {
            tokenNumber: token || '000',
            items: cart,
            note: orderNote,
            createdAt: new Date().toISOString()
          };
          await BluetoothPrinterService.printKOT(currentTenant, orderData as any);
          return; // Skip system print if bluetooth worked
        } else if (result.error === 'failed') {
          setErrorMessage('Bluetooth printer connection failed. Please check if the printer is on and paired.');
        }
      } catch (error) {
        console.error('Bluetooth KOT print failed, falling back to system print:', error);
      }
    }

    const printContent = document.getElementById('kot-content');
    if (!printContent) return;

    const originalTitle = document.title;
    const token = isCreatingNew ? newTokenNum : orders.find(o => o.id === selectedOrderId)?.tokenNumber;
    document.title = `KOT - #${token}`;
    
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Apply paper width setting
    const paperWidth = currentTenant?.printerSettings?.paperWidth || '80mm';
    printContainer.style.width = paperWidth;
    printContainer.style.margin = '0 auto';
    
    printContainer.innerHTML = printContent.innerHTML;
    document.body.appendChild(printContainer);

    window.focus();
    window.print();
    
    // Clean up
    document.body.removeChild(printContainer);
    document.title = originalTitle;
  };

  if (!selectedOrderId && !isCreatingNew) {
    return (
      <div className="p-4 md:p-10 h-full bg-slate-50/50 overflow-y-auto no-scrollbar">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
              <LayoutGrid className="text-indigo-500" size={28} /> Active Terminals
            </h1>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest mt-2 opacity-80">
              {currentUser?.role === Role.WAITER ? 'Your active service tokens' : 'Global floor tracking & management'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full sm:w-auto">
              <button 
                onClick={() => setFilter('pending')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-[#1a1a37] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter('done')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'done' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Done
              </button>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none bg-rose-100 px-4 py-3 rounded-2xl border-2 border-rose-200 shadow-sm flex flex-col items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-rose-800 mb-0.5">Orders</span>
                <span className="text-rose-900 text-sm font-black leading-none">{activeOrders.length}</span>
              </div>
              <div className="flex-1 sm:flex-none bg-indigo-100 px-4 py-3 rounded-2xl border-2 border-indigo-200 shadow-sm flex flex-col items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-800 mb-0.5">Total</span>
                <span className="text-indigo-900 text-sm font-black leading-none">{currentTenant?.currency}{activeOrdersTotal.toFixed(0)}</span>
              </div>
            </div>

            <button 
              onClick={startNewOrder}
              className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-indigo-500 w-full sm:w-auto"
            >
              <Plus size={18} /> New Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-6">
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map(order => {
              const pendingCount = order.items.filter(i => i.status === OrderStatus.PENDING).reduce((acc, i) => acc + i.quantity, 0);
              const preparingCount = order.items.filter(i => i.status === OrderStatus.PREPARING).reduce((acc, i) => acc + i.quantity, 0);
              const readyCount = order.items.filter(i => i.status === OrderStatus.READY).reduce((acc, i) => acc + i.quantity, 0);
              const statusStyles = getStatusStyles(order.status);

              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className="group relative bg-white rounded-[2.5rem] shadow-2xl border-4 border-black transition-all duration-300 text-left flex flex-col min-h-[280px] hover:scale-[1.02] overflow-hidden"
                >
                  {/* Top Border Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-4 ${statusStyles.topBorder}`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full p-6 pt-10">
                    <div className="flex flex-col items-center mb-4">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Status Overview</h3>
                      <div className={`w-10 h-1.5 rounded-full mt-1.5 ${statusStyles.topBorder}`}></div>
                    </div>

                    {/* Token Number Pill (Exactly like image) */}
                    <div className="flex justify-center mb-6 relative">
                      <div className={`min-w-[4.5rem] px-5 h-16 rounded-[2rem] border-4 border-black flex items-center justify-center font-black text-3xl text-white shadow-2xl ${statusStyles.topBorder}`}>
                        {order.tokenNumber}
                      </div>
                      {(order.tableNumber || order.deliveryStaffName) && (
                        <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg">
                          {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                        </div>
                      )}
                    </div>

                    {order.deliveryStaffName && (
                      <div className="mb-4 text-center">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{order.deliveryStaffName}</p>
                        {order.deliveryStaffMobile && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{order.deliveryStaffMobile}</p>}
                      </div>
                    )}

                    {/* Status Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <StatusBadge label="PENDING" count={pendingCount} styles={getStatusStyles(OrderStatus.PENDING)} />
                      <StatusBadge label="READY" count={preparingCount} styles={getStatusStyles(OrderStatus.PREPARING)} />
                      <StatusBadge label="DONE" count={readyCount} styles={getStatusStyles(OrderStatus.READY)} />
                    </div>

                    {/* Items Summary List */}
                    <div className="mb-4 space-y-1">
                      {(() => {
                        const groupedItems: { [key: string]: { name: string, quantity: number, status: OrderStatus } } = {};
                        order.items.forEach(item => {
                          // Only show items when their status is READY (OrderStatus.PREPARING)
                          if (item.status === OrderStatus.PREPARING) {
                            const key = `${item.itemId}-${item.status}`;
                            if (!groupedItems[key]) {
                              groupedItems[key] = { name: item.name, quantity: 0, status: item.status };
                            }
                            groupedItems[key].quantity += item.quantity;
                          }
                        });
                        
                        return Object.entries(groupedItems).map(([key, group]) => {
                          const styles = getStatusStyles(group.status);
                          return (
                            <div key={key} className={`flex justify-between items-center text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border ${styles.bg} ${styles.text} ${styles.border}`}>
                              <span className="break-words pr-2">{group.name}</span>
                              <span className="shrink-0">x{group.quantity}</span>
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
                              if (currentTenant?.printerSettings?.pairedPrinterId) {
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
                                setErrorMessage('No printer paired. Please pair a printer in Settings.');
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
                </motion.button>
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
                    Active: {activeOrders.length}
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
                      <option value="__ADD_NEW__" className="font-bold text-indigo-600">+ Create New Table</option>
                    )}
                  </select>
                </div>
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
                <option value="" className="text-sm">Select Menu</option>
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
                      <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-tight group-hover:text-indigo-600 transition-colors mb-1">{item.name}</h4>
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
          {activeCategory && filteredMenu.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <Search size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">
                  No items found
                </p>
            </div>
          )}

          {/* Mobile Embedded Basket - Visible below menu items */}
          <div className={`lg:hidden ${activeCategory ? 'mt-12' : 'mt-4'} mb-20`}>
            <POSCartContent 
              isEmbedded 
              isCreatingNew={isCreatingNew}
              newTableNum={newTableNum}
              selectedOrderId={selectedOrderId}
              orders={orders}
              cartCount={cartCount}
              currentUser={currentUser}
              isDelivery={isDelivery}
              setIsDelivery={setIsDelivery}
              deliveryStaff={deliveryStaff}
              selectedDeliveryStaffId={selectedDeliveryStaffId}
              setSelectedDeliveryStaffId={setSelectedDeliveryStaffId}
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
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
            isDelivery={isDelivery}
            setIsDelivery={setIsDelivery}
            deliveryStaff={deliveryStaff}
            selectedDeliveryStaffId={selectedDeliveryStaffId}
            setSelectedDeliveryStaffId={setSelectedDeliveryStaffId}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
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
      <div id="kot-content" className="hidden print:block p-4 font-mono print-visible text-black">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h2 className="text-3xl font-bold uppercase tracking-widest">KITCHEN TICKET</h2>
          <p className="text-lg font-bold">Token: #{isCreatingNew ? newTokenNum : orders.find(o => o.id === selectedOrderId)?.tokenNumber}</p>
          <p className="text-lg font-bold">Table: {isCreatingNew ? (isDelivery ? 'Delivery' : newTableNum) : orders.find(o => o.id === selectedOrderId)?.tableNumber}</p>
          <p className="text-base mt-1 font-bold">{new Date().toLocaleString()}</p>
        </div>
        
        <div className="space-y-3 mb-4">
          {groupItems(cart).map((item, i) => (
            <div key={i} className="flex justify-between items-start text-xl font-black">
              <span className="text-black">x{item.quantity} {item.name}</span>
            </div>
          ))}
        </div>

        {orderNote && (
          <div className="border-t border-black pt-2 mb-4">
            <p className="text-base font-bold uppercase text-black">Note:</p>
            <p className="text-lg font-black italic text-black">{orderNote}</p>
          </div>
        )}

        <div className="text-center border-t-2 border-black pt-4">
          <p className="text-base font-bold text-black">End of Ticket</p>
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
                isDelivery={isDelivery}
                setIsDelivery={setIsDelivery}
                deliveryStaff={deliveryStaff}
                selectedDeliveryStaffId={selectedDeliveryStaffId}
                setSelectedDeliveryStaffId={setSelectedDeliveryStaffId}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
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
                <h3 className="text-xl font-black text-slate-900 mb-2">Create New Table</h3>
                <p className="text-sm text-slate-500 mb-6">Enter a name or number for the new table.</p>
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
                      setIsAddingTableModalOpen(false);
                      setNewTableNameInput('');
                    }
                  }}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  autoFocus
                />
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                  <button
                    onClick={() => {
                      setIsAddingTableModalOpen(false);
                      setNewTableNameInput('');
                    }}
                    className="flex-1 px-4 py-4 sm:py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newTableNameInput.trim()) {
                        const tableName = newTableNameInput.trim();
                        addTable({ id: `tbl-${Date.now()}`, name: tableName, isActive: true });
                        setNewTableNum(tableName);
                        setIsAddingTableModalOpen(false);
                        setNewTableNameInput('');
                      }
                    }}
                    disabled={!newTableNameInput.trim()}
                    className="flex-1 px-4 py-4 sm:py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                  >
                    Create Table
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
