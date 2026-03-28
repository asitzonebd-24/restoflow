
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

const StatusBadge = ({ label, count, styles, active }: { label: string, count: number, styles: any, active?: boolean }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${active ? `${styles.bg} ${styles.border} ${styles.text} border-current` : 'bg-slate-50/50 border-slate-100 text-slate-300'}`}>
    <span className="text-[7px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</span>
    <span className="text-lg font-black">{count}</span>
  </div>
);

const ItemSummary = ({ cart, cartTotal, currency }: { cart: OrderItem[], cartTotal: number, currency: string }) => (
  <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm mb-4">
    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Item Summary</h3>
    <div className="space-y-2">
      {cart.map(item => (
        <div key={item.rowId} className="flex justify-between text-xs gap-2">
          <span className="font-medium text-slate-700 break-words flex-1">{item.quantity} x {item.name}</span>
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
  printKOT
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
  printKOT: () => void
}) => (
  <div className={`flex flex-col ${isEmbedded ? 'h-auto' : 'h-full'} bg-white border-l-2 border-indigo-500 shadow-2xl shadow-indigo-100`}>
    <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <ShoppingBasket size={20} className="text-indigo-500" /> {isEmbedded ? 'Current Selection' : 'Order Basket'}
          </h2>
          {isCreatingNew ? (
            newTableNum && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-8">
                Table: {newTableNum}
              </span>
            )
          ) : (
            selectedOrderId && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-8">
                Table: {orders.find(o => o.id === selectedOrderId)?.tableNumber || 'N/A'}
              </span>
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
                const canUpdate = !isExisting || isAdmin;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.rowId} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all group shadow-sm"
                  >
                    <div className="min-w-0 pr-4">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentTenant.currency}{item.price.toFixed(2)}</p>
                          {isExisting && (
                            <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Existing</span>
                          )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                        <button 
                          onClick={() => updateQuantity(item.rowId, -1)} 
                          disabled={!canUpdate}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${canUpdate ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'opacity-20 cursor-not-allowed text-slate-300'}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-8 text-center text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.rowId, 1)} 
                          disabled={!canUpdate}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${canUpdate ? 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500' : 'opacity-20 cursor-not-allowed text-slate-300'}`}
                        >
                          <Plus size={14} />
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
          disabled={cart.length === 0 || isTokenDuplicate || (isCreatingNew && !newTableNum.trim() && !isDelivery) || (isDelivery && !selectedDeliveryStaffId) || isSubmitting}
          className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 border-2 ${isTokenDuplicate ? 'bg-rose-500 text-white border-rose-600 shadow-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800 border-indigo-500 shadow-indigo-100'}`}
        >
          {isSubmitting ? 'Processing...' : (isCreatingNew ? (isTokenDuplicate ? 'Duplicate Token' : (!newTableNum.trim() && !isDelivery ? 'Table Required' : (isDelivery && !selectedDeliveryStaffId ? 'Select Staff' : 'Send to Kitchen'))) : 'Update Order')} <ArrowRight size={18} />
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
  const { menu, currentTenant, currentUser, addOrder, updateOrderItems, orders, users } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
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

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const deliveryStaff = useMemo(() => {
    return users.filter(u => u.role === Role.DELIVERY);
  }, [users]);

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    if (currentUser?.role === Role.WAITER) {
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

  const getWaiterName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getWaiterAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.avatar : '';
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
    setCart(prev => prev.map(i => {
      if (i.rowId === rowId) {
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
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isCreatingNew) {
        if (isTokenDuplicate) {
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
            printKOT();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(m => {
      const matchesCategory = activeCategory !== 'All' && m.category === activeCategory;
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
        <div className="flex flex-col items-start mb-6 md:mb-10 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
              <LayoutGrid className="text-indigo-500" size={28} /> Active Terminals
            </h1>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest mt-2 opacity-80">
              {currentUser?.role === Role.WAITER ? 'Your active service tokens' : 'Global floor tracking & management'}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border-2 border-slate-100 shadow-sm w-full md:w-64">
              <button 
                onClick={() => setFilter('pending')}
                className={`w-1/2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-[#1a1a37] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter('done')}
                className={`w-1/2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'done' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Done
              </button>
            </div>
            <button className="bg-rose-100 px-6 py-3 rounded-2xl border-2 border-rose-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-rose-800 w-full md:w-64">
              Active Orders: <span className="text-rose-900 text-sm">{activeOrders.length}</span>
            </button>
            <button className="bg-indigo-100 px-6 py-3 rounded-2xl border-2 border-indigo-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-indigo-800 w-full md:w-64">
              Total Amount: <span className="text-indigo-900 text-sm">{currentTenant?.currency}{activeOrdersTotal.toFixed(2)}</span>
            </button>
            <button 
              onClick={startNewOrder}
              className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-indigo-500 w-full md:w-64"
            >
              <Plus size={18} /> New Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-12">
          <AnimatePresence mode="popLayout">
            {activeOrders.map(order => {
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
                  
                  <div className="relative z-10 flex flex-col h-full p-4 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{getWaiterName(order.createdBy).split(' ')[0].toUpperCase()}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">Status Overview</p>
                        <div className={`w-8 h-1.5 ml-auto rounded-full ${statusStyles.topBorder}`}></div>
                      </div>
                    </div>

                    {/* Token Number Pill (Exactly like image) */}
                    <div className="flex justify-center mb-4 relative">
                      <div className={`min-w-[3rem] px-3 h-12 rounded-[1.5rem] border-2 border-black flex items-center justify-center font-black text-xl text-white shadow-xl ${statusStyles.topBorder}`}>
                        {order.tokenNumber}
                      </div>
                      {(order.tableNumber || order.deliveryStaffName) && (
                        <div className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                          {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : `T-${order.tableNumber}`}
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
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <StatusBadge label="Pending" count={pendingCount} styles={getStatusStyles(OrderStatus.PENDING)} active={order.status === OrderStatus.PENDING} />
                      <StatusBadge label="Ready" count={preparingCount} styles={getStatusStyles(OrderStatus.PREPARING)} active={order.status === OrderStatus.PREPARING} />
                      <StatusBadge label="Done" count={readyCount} styles={getStatusStyles(OrderStatus.READY)} active={order.status === OrderStatus.READY} />
                    </div>

                    {/* Ready Items List */}
                    {preparingCount > 0 && (
                      <div className="mb-4 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                        {order.items.filter(i => i.status === OrderStatus.PREPARING).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-black text-amber-600 uppercase tracking-tight bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dashed Divider */}
                    <div className="border-t-2 border-dashed border-black mb-6"></div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-end">
                      <div className="bg-black text-white px-5 py-2.5 rounded-full font-black text-sm flex items-center gap-1 shadow-lg">
                        <span className="text-xs">{currentTenant?.currency}</span>
                        {order.totalAmount.toFixed(0)}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50/50 h-[calc(100vh-64px)] md:h-full overflow-y-auto lg:overflow-hidden no-scrollbar">
      <div className="flex-none lg:flex-1 flex flex-col min-w-0 lg:overflow-hidden border-r border-slate-100">
        {/* POS Header */}
        <div className="p-4 md:p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-90"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
                  {isCreatingNew ? 'New Order Terminal' : `Token #${activeOrders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    Active Orders: {activeOrders.length}
                  </span>
                </h2>
                {isCreatingNew && (
                  <div className="flex items-center gap-4 md:gap-6 mt-1 md:mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Token:</span>
                      <input 
                        type="text" 
                        value={newTokenNum}
                        onChange={(e) => setNewTokenNum(e.target.value)}
                        className={`w-8 text-center border-b-2 bg-transparent font-bold text-base outline-none transition-all ${isTokenDuplicate ? 'border-rose-500 text-rose-600' : 'border-slate-900 text-slate-900'}`}
                      />
                      {isTokenDuplicate && <AlertCircle className="text-rose-500" size={12} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Table:</span>
                      <input 
                        type="text" 
                        placeholder="No"
                        value={newTableNum}
                        onChange={(e) => setNewTableNum(e.target.value)}
                        className="w-10 text-center border-b-2 bg-transparent font-bold text-base outline-none transition-all border-slate-900 text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full md:w-72">
              <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                  <input 
                      type="text" 
                      placeholder="Search menu..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-indigo-500 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100"
                  />
              </div>
              
              <div className="relative">
                <select 
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            {activeCategory === 'All' && (
              <ItemSummary cart={cart} cartTotal={cartTotal} currency={currentTenant.currency} />
            )}
          </div>

          <div className="hidden md:flex flex-row gap-4 overflow-x-auto pb-2 no-scrollbar items-center">
            <div className="flex gap-2 md:gap-3 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all border-2 shrink-0 ${
                    activeCategory === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-500 hover:text-indigo-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-none lg:flex-1 lg:overflow-y-auto p-4 md:p-8 no-scrollbar pb-12 lg:pb-32">
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
                  className="group bg-white rounded-[1.5rem] border-2 border-black p-3 flex flex-col hover:border-indigo-500 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all active:scale-95 relative overflow-hidden hover:-translate-y-1"
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
          {filteredMenu.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <Search size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest opacity-40">No items found</p>
            </div>
          )}

          {/* Mobile Embedded Basket - Visible below menu items */}
          {cart.length > 0 && (
            <div className="lg:hidden mt-12 mb-20">
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
              />
            </div>
          )}
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
          {cart.map((item, i) => (
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
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
