
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
  Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const POS = () => {
  const { menu, currentTenant, currentUser, addOrder, updateOrderItems, orders, users } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [orderNote, setOrderNote] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTokenNum, setNewTokenNum] = useState('');
  const [newTableNum, setNewTableNum] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    if (currentUser?.role === Role.WAITER) {
      filtered = filtered.filter(o => o.createdBy === currentUser.id);
    }
    return filtered;
  }, [orders, currentUser]);

  const isTokenDuplicate = useMemo(() => {
    const allActive = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    return isCreatingNew && allActive.some(o => o.tokenNumber === newTokenNum);
  }, [isCreatingNew, orders, newTokenNum]);

  const getWaiterName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getWaiterAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.avatar : `https://ui-avatars.com/api/?name=W&background=random`;
  };

  const getStatusStyles = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-500' };
      case OrderStatus.PREPARING: 
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500' };
      case OrderStatus.READY: 
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' };
      default: 
        return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', dot: 'bg-slate-500' };
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCart(order.items);
    setOrderNote(order.note || '');
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
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) return;
    setCart(prev => [
      ...prev, 
      { 
        rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: item.id, 
        name: item.name, 
        quantity: 1, 
        price: item.price,
        status: OrderStatus.PENDING 
      }
    ]);
  };

  const updateQuantity = (rowId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.rowId === rowId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const createAndSubmitOrder = () => {
    if (cart.length === 0) return;

    if (isCreatingNew) {
      if (isTokenDuplicate) return;
      const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const newOrder = {
        id: `ord-${Date.now()}`,
        tokenNumber: newTokenNum,
        tableNumber: newTableNum,
        items: cart,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        createdBy: currentUser!.id,
        totalAmount,
        note: orderNote
      };
      addOrder(newOrder);
    } else if (selectedOrderId) {
      const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      updateOrderItems(selectedOrderId, cart, totalAmount, orderNote);
    }

    setSelectedOrderId(null);
    setIsCreatingNew(false);
    setCart([]);
    setOrderNote('');
    setNewTableNum('');
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(m => {
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, activeCategory, searchTerm]);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const StatusBadge = ({ label, count, styles }: { label: string, count: number, styles: any }) => (
    <div className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${count > 0 ? `${styles.bg} ${styles.border} ${styles.text}` : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
      <span className="text-[8px] font-bold uppercase tracking-widest mb-1 opacity-60">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );

  const POSCartContent = () => (
    <div className="flex flex-col h-full bg-white border-l-2 border-indigo-500 shadow-2xl shadow-indigo-100">
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <ShoppingBasket size={20} className="text-indigo-500" /> Order Basket
          </h2>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
            {cartCount} Items
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium">Review selection before processing</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 no-scrollbar">
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
            cart.map(item => (
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentTenant.currency}{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                    <button onClick={() => updateQuantity(item.rowId, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"><Minus size={14} /></button>
                    <span className="font-bold text-sm w-8 text-center text-slate-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.rowId, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-all"><Plus size={14} /></button>
                </div>
              </motion.div>
            ))
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
            disabled={cart.length === 0 || isTokenDuplicate}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 border-2 ${isTokenDuplicate ? 'bg-rose-500 text-white border-rose-600 shadow-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800 border-indigo-500 shadow-indigo-100'}`}
          >
            {isCreatingNew ? (isTokenDuplicate ? 'Duplicate Token' : 'Send to Kitchen') : 'Update Order'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!selectedOrderId && !isCreatingNew) {
    return (
      <div className="p-6 md:p-10 h-full bg-slate-50/50 overflow-y-auto no-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
              <LayoutGrid className="text-indigo-500" size={32} /> Active Terminals
            </h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">
              {currentUser?.role === Role.WAITER ? 'Your active service tokens' : 'Global floor tracking & management'}
            </p>
          </div>
          <button 
            onClick={startNewOrder}
            className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-indigo-500"
          >
            <Plus size={20} /> New Order
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-12">
          <AnimatePresence mode="popLayout">
            {activeOrders.map(order => {
              const pendingCount = order.items.filter(i => i.status === OrderStatus.PENDING).reduce((acc, i) => acc + i.quantity, 0);
              const preparingCount = order.items.filter(i => i.status === OrderStatus.PREPARING).reduce((acc, i) => acc + i.quantity, 0);
              const readyCount = order.items.filter(i => i.status === OrderStatus.READY).reduce((acc, i) => acc + i.quantity, 0);
              const statusStyles = getStatusStyles(order.status);
              const isOnline = order.tokenNumber.startsWith(currentTenant.customerTokenPrefix || 'WEB') || order.tokenNumber === 'OO';
              const headerLabel = isOnline ? 'Online Order' : 'Service Token';

              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`group relative bg-white rounded-[2rem] p-6 shadow-xl border-2 transition-all duration-300 text-left flex flex-col min-h-[260px] hover:scale-[1.02] ${
                    order.status === OrderStatus.PENDING ? 'border-rose-500 shadow-rose-100' :
                    order.status === OrderStatus.PREPARING ? 'border-amber-500 shadow-amber-100' :
                    'border-emerald-500 shadow-emerald-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border} flex items-center gap-2`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}></div>
                      {order.status}
                    </div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{headerLabel}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${statusStyles.bg} flex items-center justify-center font-bold text-2xl ${statusStyles.text} border ${statusStyles.border} shadow-inner group-hover:scale-110 transition-transform`}>
                      {order.tokenNumber}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">Table {order.tableNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Ref: #{order.id.slice(-4).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <StatusBadge label="Pending" count={pendingCount} styles={getStatusStyles(OrderStatus.PENDING)} />
                      <StatusBadge label="Prep" count={preparingCount} styles={getStatusStyles(OrderStatus.PREPARING)} />
                      <StatusBadge label="Ready" count={readyCount} styles={getStatusStyles(OrderStatus.READY)} />
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={getWaiterAvatar(order.createdBy)} className="w-6 h-6 rounded-lg border border-slate-100" alt="W" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{getWaiterName(order.createdBy).split(' ')[0]}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {currentTenant?.currency}{order.totalAmount.toFixed(2)}
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
    <div className="flex flex-col lg:flex-row bg-slate-50/50 h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-slate-100">
        {/* POS Header */}
        <div className="p-6 md:p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
                className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-indigo-100 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {isCreatingNew ? 'New Order Terminal' : `Token #${activeOrders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
                </h2>
                {isCreatingNew && (
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Token:</span>
                      <input 
                        type="text" 
                        value={newTokenNum}
                        onChange={(e) => setNewTokenNum(e.target.value)}
                        className={`w-10 text-center border-b-2 bg-transparent font-bold text-lg outline-none transition-all ${isTokenDuplicate ? 'border-rose-500 text-rose-600' : 'border-slate-900 text-slate-900'}`}
                      />
                      {isTokenDuplicate && <AlertCircle className="text-rose-500" size={14} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Table:</span>
                      <input 
                        type="text" 
                        placeholder="No"
                        value={newTableNum}
                        onChange={(e) => setNewTableNum(e.target.value)}
                        className="w-12 text-center border-b-2 bg-transparent font-bold text-lg outline-none transition-all border-slate-900 text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative w-full md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Search menu..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-500 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100"
                />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border-2 shrink-0 ${
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

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMenu.map(item => (
                <motion.button 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="group bg-white rounded-[2.5rem] border-2 border-slate-100 p-5 flex flex-col hover:border-indigo-500 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all active:scale-95 relative overflow-hidden hover:-translate-y-1"
                >
                  <div className="w-full aspect-square rounded-[2rem] overflow-hidden mb-4 bg-slate-50 relative border border-slate-100">
                    <img src={item.image || `https://picsum.photos/seed/${item.name}/400/400`} alt={item.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.stock !== undefined && item.stock !== null && item.stock <= 0 ? 'grayscale opacity-50' : ''}`} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors"></div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-900">{currentTenant.currency}{item.price.toFixed(0)}</span>
                    </div>
                    {item.stock !== undefined && item.stock !== null && item.stock <= 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-2xl transform -rotate-6 border-2 border-white/20">
                          Sold Out
                        </span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3 w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300">
                          <Plus size={20} strokeWidth={3} />
                      </div>
                    )}
                    {item.stock !== undefined && item.stock !== null && item.stock > 0 && item.stock <= 10 && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-lg border border-white/20">
                        Low Stock: {item.stock}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
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
        </div>
      </div>

      {/* Desktop Sidebar Basket */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-white flex-col shadow-2xl shrink-0">
         <POSCartContent />
      </div>

      {/* Mobile Sticky Summary Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex items-center justify-between z-[50] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">{cartCount} Items Selected</span>
                <span className="text-2xl font-bold text-slate-900 leading-none">{currentTenant.currency}{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={createAndSubmitOrder}
              disabled={isTokenDuplicate}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition flex items-center gap-3"
            >
              {isCreatingNew ? 'Send to Kitchen' : 'Update'} <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
