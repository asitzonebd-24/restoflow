
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
        return { border: 'border-t-red-500', bg: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-600', borderLight: 'border-red-200' };
      case OrderStatus.PREPARING: 
        return { border: 'border-t-yellow-500', bg: 'bg-yellow-500', lightBg: 'bg-amber-50', text: 'text-amber-600', borderLight: 'border-amber-200' };
      case OrderStatus.READY: 
        return { border: 'border-t-green-500', bg: 'bg-green-500', lightBg: 'bg-emerald-50', text: 'text-emerald-600', borderLight: 'border-emerald-200' };
      default: 
        return { border: 'border-t-black', bg: 'bg-black', lightBg: 'bg-slate-50', text: 'text-slate-600', borderLight: 'border-slate-200' };
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
    <div className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl border-2 transition-all ${count > 0 ? activeColor : colorClass}`}>
      <span className="text-[7px] font-black uppercase tracking-widest opacity-80 mb-0.5">{label}</span>
      <span className="text-sm font-black">{count}</span>
    </div>
  );

  const POSCartContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b-4 border-black bg-slate-50 shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
           <ShoppingBasket size={24} strokeWidth={3} /> Basket
        </h2>
      </div>

      <div className="p-4 md:p-6 space-y-3 h-auto">
        {cart.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-200">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p className="font-black uppercase text-[10px] tracking-[0.3em]">No items added</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.rowId} className="bg-slate-50 p-3 rounded-[1.5rem] border-2 border-black flex justify-between items-center shadow-sm">
              <div className="min-w-0 pr-4">
                  <h4 className="font-black text-[9px] md:text-[10px] uppercase truncate">{item.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400">{currentTenant.currency}{item.price.toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-inner">
                  <button onClick={() => updateQuantity(item.rowId, -1)} className="p-1.5 hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Minus size={10} strokeWidth={4}/></button>
                  <span className="font-black text-[11px] w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.rowId, 1)} className="p-1.5 hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Plus size={10} strokeWidth={4}/></button>
              </div>
            </div>
          ))
        )}
      </div>

      <div id="staff-note-section" className="p-6 border-t-8 border-black bg-slate-50 shrink-0 transition-all duration-500">
        <div className="space-y-4 mb-6">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-2">
            <FileText size={12} /> Kitchen Notes
          </label>
          <textarea 
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="e.g. Extra spicy, No onions..."
            className="w-full p-4 border-4 border-black rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-inner h-20 resize-none"
          />
        </div>
        
        <div className="flex justify-between items-center mb-6">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest leading-none">Subtotal</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{currentTenant.currency}{cartTotal.toFixed(0)}</span>
        </div>

        <button 
          onClick={createAndSubmitOrder}
          disabled={cart.length === 0 || isTokenDuplicate}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-30 border-4 border-white ${isTokenDuplicate ? 'bg-red-500 text-white' : 'bg-black text-white'}`}
        >
          {isCreatingNew ? (isTokenDuplicate ? 'Duplicate Token' : 'Fire Token') : 'Update Order'} <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  if (!selectedOrderId && !isCreatingNew) {
    return (
      <div className="p-4 md:p-8 h-full bg-[#f1f5f9] overflow-y-auto no-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter flex items-center gap-4 uppercase">
              <LayoutGrid className="text-indigo-600" size={36} strokeWidth={3} /> Token Hub
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 opacity-80">
              {currentUser?.role === Role.WAITER ? 'Your personal active tokens' : 'Global Floor tracking'}
            </p>
          </div>
          <button 
            onClick={startNewOrder}
            className="w-full md:w-auto bg-black text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-4 border-white"
          >
            <Plus size={24} strokeWidth={3} /> New Token
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-8 pb-12">
          {activeOrders.map(order => {
            const pendingCount = order.items.filter(i => i.status === OrderStatus.PENDING).reduce((acc, i) => acc + i.quantity, 0);
            const preparingCount = order.items.filter(i => i.status === OrderStatus.PREPARING).reduce((acc, i) => acc + i.quantity, 0);
            const readyCount = order.items.filter(i => i.status === OrderStatus.READY).reduce((acc, i) => acc + i.quantity, 0);
            const statusColors = getStatusColorClasses(order.status);
            const isOnline = order.tokenNumber.startsWith(currentTenant.customerTokenPrefix || 'WEB') || order.tokenNumber === 'OO';
            const headerLabel = isOnline ? 'Online Order' : 'Status Overview';

            return (
              <button
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className={`group relative bg-white rounded-[2.5rem] p-4 shadow-xl border-t-8 ${statusColors.border} border-x-4 border-b-4 border-black hover:border-indigo-600 hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-2 active:scale-95 flex flex-col items-center justify-between min-h-[200px] mt-4`}
              >
                <div className="w-full">
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-0.5">{headerLabel}</div>
                    <div className={`h-1.5 w-10 ${statusColors.bg} rounded-full`}></div>
                  </div>
                  <div className="flex justify-center items-center my-2">
                    <div className={`px-4 py-2 min-w-[64px] ${statusColors.bg} border-4 border-black rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="text-white text-xl font-black leading-none">{order.tokenNumber}</span>
                    </div>
                  </div>
                  {order.tableNumber && (
                    <div className="flex justify-center mb-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-black">
                        Table: {order.tableNumber}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <StatusBox label="Pending" count={pendingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-red-50 border-red-200 text-red-600 shadow-sm" />
                    <StatusBox label="Preparing" count={preparingCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-amber-50 border-amber-200 text-amber-600 shadow-sm" />
                    <StatusBox label="Done" count={readyCount} colorClass="bg-slate-50 border-slate-100 text-slate-300" activeColor="bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" />
                  </div>
                  <div className="pt-3 border-t-2 border-black border-dashed flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src={getWaiterAvatar(order.createdBy)} className="w-8 h-8 rounded-full border-2 border-black shadow-sm" alt="W" />
                      <span className="text-[9px] font-black text-black uppercase tracking-widest truncate max-w-[60px]">{getWaiterName(order.createdBy).split(' ')[0]}</span>
                    </div>
                    <div className="bg-black text-white px-2 py-1 rounded-xl text-[10px] font-black">
                      {currentTenant?.currency}{order.totalAmount.toFixed(0)}
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
    <div className="flex flex-col lg:flex-row bg-[#f1f5f9] min-h-full lg:h-[calc(100vh-64px)] lg:overflow-hidden relative">
      <div className="flex-1 p-4 md:p-6 lg:overflow-y-auto flex flex-col min-h-0 no-scrollbar">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => { setSelectedOrderId(null); setIsCreatingNew(false); }}
              className="p-3 md:p-4 bg-white rounded-2xl md:rounded-3xl shadow-xl border-4 border-black text-black hover:bg-black hover:text-white transition transform active:scale-90"
            >
              <ArrowLeft size={20} md:size={24} strokeWidth={4} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black text-black tracking-tighter uppercase leading-none">
                {isCreatingNew ? 'Token Assignment' : `Token ${activeOrders.find(o => o.id === selectedOrderId)?.tokenNumber}`}
              </h2>
              {isCreatingNew && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-black uppercase">No:</span>
                  <input 
                    type="text" 
                    value={newTokenNum}
                    onChange={(e) => setNewTokenNum(e.target.value)}
                    className={`w-12 text-center border-b-2 bg-transparent font-black text-xl outline-none transition-all ${isTokenDuplicate ? 'border-red-500 text-red-600' : 'border-indigo-600 text-indigo-700'}`}
                  />
                  {isTokenDuplicate && <AlertCircle className="text-red-500" size={14} />}
                </div>
              )}
              {isCreatingNew && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-black uppercase">Table:</span>
                  <input 
                    type="text" 
                    placeholder="No"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-16 text-center border-b-2 bg-transparent font-black text-xl outline-none transition-all border-indigo-600 text-indigo-700"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 shrink-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-4 shrink-0 ${
                activeCategory === cat 
                ? 'bg-black text-white border-black shadow-lg scale-105' 
                : 'bg-white text-gray-500 border-white hover:border-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 pb-32">
          {filteredMenu.map(item => (
            <button 
              key={item.id} 
              onClick={() => addToCart(item)}
              className="aspect-square bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-lg border-4 border-black p-3 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform active:scale-90 hover:border-indigo-500 group"
            >
              <span className="text-[10px] md:text-[12px] font-black text-black line-clamp-2 mb-1.5 uppercase tracking-tighter leading-tight group-hover:text-indigo-600">
                {item.name}
              </span>
              <span className="text-[10px] font-black text-white bg-black px-3 py-1 rounded-xl border-2 border-black">
                {currentTenant?.currency}{item.price.toFixed(0)}
              </span>
            </button>
          ))}
        </div>

        {/* Inline Mobile Basket - Same as Customer Portal */}
        <div className="lg:hidden mt-20 border-t-8 border-black -mx-4 md:-mx-6">
           <POSCartContent />
        </div>
      </div>

      {/* Desktop Sidebar Basket */}
      <div className="hidden lg:flex w-[400px] bg-white border-l-8 border-black flex-col shadow-2xl shrink-0 overflow-y-auto no-scrollbar">
         <POSCartContent />
      </div>

      {/* Mobile Sticky Summary Bar - Mirrored from Customer Panel */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-20 right-0 bg-white border-t-4 border-black p-4 flex items-center justify-between z-[120] animate-in slide-in-from-bottom-full shadow-[0_-12px_40px_rgba(0,0,0,0.15)]">
           <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{cartCount} Selections</span>
              <span className="text-xl font-black text-indigo-600 leading-none">{currentTenant.currency}{cartTotal.toFixed(0)}</span>
           </div>
           <button 
             onClick={createAndSubmitOrder}
             disabled={isTokenDuplicate}
             className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border-4 border-white shadow-xl active:scale-95 transition flex items-center gap-2"
           >
             {isCreatingNew ? 'Fire Token' : 'Update'} <ArrowRight size={16} strokeWidth={3} />
           </button>
        </div>
      )}
    </div>
  );
};
