
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, OrderItem, Order, OrderStatus, Role } from '../types';
import { ShoppingCart, Plus, Minus, ChefHat, Send, FileText, Hash, LayoutGrid, ArrowLeft, User as UserIcon, CheckCircle2, AlertCircle, ShoppingBag, X, ArrowRight, ShoppingBasket } from 'lucide-react';

export const POS = () => {
  const { menu, currentTenant, currentUser, addOrder, updateOrderItems, orders, users } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [orderNote, setOrderNote] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTokenNum, setNewTokenNum] = useState('');
  const [newTableNum, setNewTableNum] = useState('');

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

  const getStatusColorClasses = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: 
        return { border: 'border-red-100', bg: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-600', borderLight: 'border-red-200', icon: 'text-red-500' };
      case OrderStatus.PREPARING: 
        return { border: 'border-amber-100', bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-600', borderLight: 'border-amber-200', icon: 'text-amber-500' };
      case OrderStatus.READY: 
        return { border: 'border-emerald-100', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-600', borderLight: 'border-emerald-200', icon: 'text-emerald-500' };
      default: 
        return { border: 'border-slate-100', bg: 'bg-slate-900', lightBg: 'bg-slate-50', text: 'text-slate-600', borderLight: 'border-slate-200', icon: 'text-slate-500' };
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

  const filteredMenu = activeCategory === 'All' ? menu : menu.filter(m => m.category === activeCategory);
  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const StatusBox = ({ label, count, colorClass, activeColor }: { label: string, count: number, colorClass: string, activeColor: string }) => (
    <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${count > 0 ? activeColor : colorClass}`}>
      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );

  const POSCartContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <ShoppingBasket size={24} className="text-slate-400" /> Basket
          </h2>
          <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
            {cartCount} Items
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium">Review items before sending to kitchen</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {cart.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart size={48} strokeWidth={1} className="mb-4 opacity-40" />
              <p className="text-sm font-medium opacity-60 uppercase tracking-widest">No items added</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.rowId} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-slate-200 transition-all group">
              <div className="min-w-0 pr-4">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                  <p className="text-xs font-medium text-slate-400">{currentTenant.currency}{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                  <button onClick={() => updateQuantity(item.rowId, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 hover:text-red-500 transition-all shadow-sm"><Minus size={12} /></button>
                  <span className="font-bold text-sm w-6 text-center text-slate-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.rowId, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 hover:text-emerald-500 transition-all shadow-sm"><Plus size={12} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="space-y-4 mb-6">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-1 block flex items-center gap-2">
            <FileText size={12} /> Kitchen Notes
          </label>
          <textarea 
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="e.g. Extra spicy, No onions..."
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 transition-all shadow-inner h-20 resize-none"
          />
        </div>
        
        <div className="flex justify-between items-center mb-6">
            <span className="font-bold uppercase text-[10px] text-slate-400 tracking-widest">Total Amount</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">{currentTenant.currency}{cartTotal.toFixed(2)}</span>
        </div>

        <button 
          onClick={createAndSubmitOrder}
          disabled={cart.length === 0 || isTokenDuplicate}
          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 ${isTokenDuplicate ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl'}`}
        >
          {isCreatingNew ? (isTokenDuplicate ? 'Duplicate Token' : 'Send to Kitchen') : 'Update Order'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  if (!selectedOrderId && !isCreatingNew) {
    return (
      <div className="p-6 md:p-10 h-full bg-slate-50/50 overflow-y-auto no-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
              <LayoutGrid className="text-slate-400" size={32} /> Active Terminals
            </h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">
              {currentUser?.role === Role.WAITER ? 'Your active service tokens' : 'Global floor tracking & management'}
            </p>
          </div>
          <button 
            onClick={startNewOrder}
            className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus size={20} /> New Order
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-12">
          {activeOrders.map(order => {
            const pendingCount = order.items.filter(i => i.status === OrderStatus.PENDING).reduce((acc, i) => acc + i.quantity, 0);
            const preparingCount = order.items.filter(i => i.status === OrderStatus.PREPARING).reduce((acc, i) => acc + i.quantity, 0);
            const readyCount = order.items.filter(i => i.status === OrderStatus.READY).reduce((acc, i) => acc + i.quantity, 0);
            const statusColors = getStatusColorClasses(order.status);
            const isOnline = order.tokenNumber.startsWith(currentTenant.customerTokenPrefix || 'WEB') || order.tokenNumber === 'OO';
            const headerLabel = isOnline ? 'Online Order' : 'Service Token';

            return (
              <button
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className="group relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex flex-col min-h-[240px]"
              >
                <div className="w-full mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${statusColors.lightBg} ${statusColors.text} border ${statusColors.borderLight}`}>
                      {order.status}
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{headerLabel}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${statusColors.lightBg} flex items-center justify-center font-bold text-2xl ${statusColors.text} border ${statusColors.borderLight} shadow-inner group-hover:scale-110 transition-transform`}>
                      {order.tokenNumber}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">Table {order.tableNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">#{order.id.slice(-4)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-auto">
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <StatusBox label="Pending" count={pendingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-red-50 border-red-100 text-red-600 shadow-sm" />
                    <StatusBox label="Prep" count={preparingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-amber-50 border-amber-100 text-amber-600 shadow-sm" />
                    <StatusBox label="Ready" count={readyCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={getWaiterAvatar(order.createdBy)} className="w-6 h-6 rounded-lg border border-slate-100 shadow-sm" alt="W" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{getWaiterName(order.createdBy).split(' ')[0]}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {currentTenant?.currency}{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50/50 min-h-full lg:h-[calc(100vh-64px)] lg:overflow-hidden relative">
      <div className="flex-1 p-6 md:p-8 lg:overflow-y-auto flex flex-col min-h-0 no-scrollbar">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
              className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all transform active:scale-90"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {isCreatingNew ? 'New Order Terminal' : `Token ${activeOrders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
              </h2>
              {isCreatingNew && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Token:</span>
                    <input 
                      type="text" 
                      value={newTokenNum}
                      onChange={(e) => setNewTokenNum(e.target.value)}
                      className={`w-12 text-center border-b-2 bg-transparent font-bold text-xl outline-none transition-all ${isTokenDuplicate ? 'border-red-500 text-red-600' : 'border-slate-900 text-slate-900'}`}
                    />
                    {isTokenDuplicate && <AlertCircle className="text-red-500" size={14} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Table:</span>
                    <input 
                      type="text" 
                      placeholder="No"
                      value={newTableNum}
                      onChange={(e) => setNewTableNum(e.target.value)}
                      className="w-16 text-center border-b-2 bg-transparent font-bold text-xl outline-none transition-all border-slate-900 text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 shrink-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border shrink-0 ${
                activeCategory === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-32">
          {filteredMenu.map(item => (
            <button 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center transition-all duration-300 transform active:scale-95 hover:border-slate-300 hover:shadow-xl group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-50">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
                {item.name}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {currentTenant?.currency}{item.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>

        {/* Inline Mobile Basket */}
        <div className="lg:hidden mt-20 border-t border-slate-200 -mx-6 md:-mx-8">
           <POSCartContent />
        </div>
      </div>

      {/* Desktop Sidebar Basket */}
      <div className="hidden lg:flex w-[400px] bg-white border-l border-slate-200 flex-col shadow-2xl shrink-0 overflow-y-auto no-scrollbar">
         <POSCartContent />
      </div>

      {/* Mobile Sticky Summary Bar */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-20 right-0 bg-white border-t border-slate-200 p-5 flex items-center justify-between z-[120] animate-in slide-in-from-bottom-full shadow-2xl">
           <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mb-1">{cartCount} Items Selected</span>
              <span className="text-xl font-black text-slate-900 leading-none">{currentTenant.currency}{cartTotal.toFixed(2)}</span>
           </div>
           <button 
             onClick={createAndSubmitOrder}
             disabled={isTokenDuplicate}
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition flex items-center gap-3"
           >
             {isCreatingNew ? 'Send to Kitchen' : 'Update'} <ArrowRight size={18} />
           </button>
        </div>
      )}
    </div>
  );
};
