
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, OrderItem, Order, OrderStatus } from '../types';
import { ShoppingBasket, Plus, Minus, Search, ArrowRight, LogOut, MapPin, Menu as MenuIcon, X, ShoppingCart, Timer, History, ShoppingBag, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const CustomerOrder = () => {
  const { menu, business, addOrder, currentUser, logout, updateBusiness } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  const [useProfileAddress, setUseProfileAddress] = useState(!!currentUser?.address);
  const [manualAddress, setManualAddress] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const filteredMenu = menu.filter(item => 
    item.isAvailable &&
    (activeCategory === 'All' || item.category === activeCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        rowId: `c-${Date.now()}-${item.id}`,
        itemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        status: OrderStatus.PENDING
      }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.itemId === itemId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !currentUser) return;
    
    const finalAddress = useProfileAddress ? (currentUser.address || '') : manualAddress;

    if (!finalAddress.trim()) {
      const el = document.querySelector('#address-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      // Brief highlight effect
      el?.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
      setTimeout(() => el?.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50'), 2000);
      return;
    }

    const prefix = business.customerTokenPrefix || 'WEB';
    const sequenceNum = business.nextCustomerToken || 100;
    const tokenNumber = `${prefix}-${sequenceNum}`;

    const newOrder = {
      id: `cust-ord-${Date.now()}`,
      tokenNumber: tokenNumber,
      items: cart,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      totalAmount: cartTotal,
      note: "Online Customer Order",
      deliveryAddress: finalAddress
    };

    addOrder(newOrder);
    // Explicitly increment the sequence
    updateBusiness({ nextCustomerToken: sequenceNum + 1 });
    setCart([]);
    navigate('/order/panel');
  };

  const isActive = (path: string) => location.pathname === path;

  const CartContent = () => (
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
                  <p className="text-[9px] font-bold text-slate-400">{business.currency}{item.price.toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-inner">
                  <button onClick={() => updateQuantity(item.itemId, -1)} className="p-1.5 hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Minus size={10} strokeWidth={4}/></button>
                  <span className="font-black text-[11px] w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.itemId, 1)} className="p-1.5 hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Plus size={10} strokeWidth={4}/></button>
              </div>
            </div>
          ))
        )}
      </div>

      <div id="address-section" className="p-6 border-t-8 border-black bg-slate-50 shrink-0 transition-all duration-500">
        <div className="space-y-4 mb-6">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-2">
            <MapPin size={12} /> Delivery Destination
          </label>
          
          <div className="flex flex-col gap-2">
            {currentUser?.address && (
              <button 
                onClick={() => setUseProfileAddress(true)}
                className={`p-3 rounded-2xl border-4 text-left transition-all flex items-center justify-between group ${useProfileAddress ? 'border-black bg-indigo-50' : 'border-slate-100 bg-white'}`}
              >
                <div className="min-w-0">
                  <p className={`text-[8px] font-black uppercase tracking-widest ${useProfileAddress ? 'text-indigo-600' : 'text-slate-400'}`}>My Profile Address</p>
                  <p className="text-[10px] font-black truncate text-slate-900">{currentUser.address}</p>
                </div>
                {useProfileAddress && <CheckCircle size={16} className="text-indigo-600 shrink-0" />}
              </button>
            )}
            
            <button 
              onClick={() => setUseProfileAddress(false)}
              className={`p-3 rounded-2xl border-4 text-left transition-all flex items-center justify-between group ${!useProfileAddress ? 'border-black bg-indigo-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="min-w-0">
                <p className={`text-[8px] font-black uppercase tracking-widest ${!useProfileAddress ? 'text-indigo-600' : 'text-slate-400'}`}>New Location / Table</p>
                <p className="text-[10px] font-black truncate text-slate-900">
                  {!useProfileAddress ? (manualAddress || 'Specify location...') : 'Specify a different address'}
                </p>
              </div>
              {!useProfileAddress && <CheckCircle size={16} className="text-indigo-600 shrink-0" />}
            </button>
          </div>

          {!useProfileAddress && (
            <input 
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g. Table 05 or 123 Street..."
              className="w-full p-4 border-4 border-black rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-inner"
            />
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest leading-none">Subtotal</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{business.currency}{cartTotal.toFixed(0)}</span>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-30 border-4 border-white"
        >
          Finalize Order <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      <aside className="h-full w-20 md:w-64 bg-black text-white z-[110] border-r-8 border-black flex flex-col items-center md:items-stretch py-8 shrink-0">
        <div className="flex items-center gap-3 px-4 md:px-8 mb-12">
           <img src={business.logo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white" />
           <h2 className="hidden md:block font-black text-lg uppercase tracking-tighter">OmniDine</h2>
        </div>
        <nav className="flex-1 space-y-4 px-2 md:px-6">
           <button onClick={() => navigate('/order')} className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <ShoppingBag size={20} /> <span className="hidden md:block">Digital Menu</span>
           </button>
           <button onClick={() => navigate('/order/panel')} className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order/panel') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <Timer size={20} /> <span className="hidden md:block">My Tokens</span>
           </button>
           <button onClick={() => navigate('/order/history')} className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 md:px-6 md:py-4 rounded-2xl transition font-black uppercase tracking-widest text-[10px] ${isActive('/order/history') ? 'bg-indigo-600 shadow-xl' : 'bg-white/5 hover:bg-white/10'}`}>
             <History size={20} /> <span className="hidden md:block">History</span>
           </button>
        </nav>
        <div className="pt-8 border-t border-white/10 mt-auto px-2 md:px-8 flex flex-col items-center md:items-start">
           <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500 mb-4" alt="avatar" />
           <button onClick={logout} className="p-4 md:w-full md:flex md:items-center md:gap-4 md:px-6 md:py-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition font-black uppercase tracking-widest text-[10px]">
             <LogOut size={20} /> <span className="hidden md:block">Sign Out</span>
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white shadow-sm border-b-4 border-black p-4 flex items-center justify-between shrink-0 z-30">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-2 border-black rounded-xl font-black uppercase text-[10px] outline-none focus:bg-white transition w-40 sm:w-64"
            />
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Basket</p>
              <p className="font-black text-indigo-600 leading-none">{business.currency}{cartTotal.toFixed(0)}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
            <div className="mb-8 overflow-x-auto pb-2 no-scrollbar flex gap-2 snap-x">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-4 transition-all shrink-0 snap-start ${
                    activeCategory === cat ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
              {filteredMenu.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="group flex flex-col bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-black p-3 md:p-5 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95 shadow-md"
                >
                  <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-black mb-3 md:mb-5 bg-slate-50 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ShoppingCart size={32} className="text-slate-200" />
                      )}
                  </div>
                  <h3 className="font-black text-[10px] md:text-[12px] uppercase tracking-tight text-slate-900 text-left line-clamp-2 leading-tight mb-2 h-7 md:h-8">{item.name}</h3>
                  <div className="mt-auto flex justify-between items-center w-full">
                      <span className="font-black text-indigo-600 text-xs md:text-base">{business.currency}{item.price.toFixed(0)}</span>
                      <div className="bg-black text-white p-1.5 md:p-2 rounded-xl border-2 border-black"><Plus size={12} md:size={14} strokeWidth={4} /></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:hidden mt-20 border-t-8 border-black -mx-4 md:-mx-8">
               <CartContent />
            </div>
          </div>

          <div className="hidden lg:flex w-[400px] bg-white border-l-8 border-black flex-col shadow-2xl shrink-0 overflow-y-auto no-scrollbar">
             <CartContent />
          </div>
        </div>

        {/* Persistent Checkout Bar for Mobile - High visibility direct trigger */}
        {cartCount > 0 && (
          <div className="lg:hidden fixed bottom-0 left-20 right-0 bg-white border-t-4 border-black p-4 flex items-center justify-between z-[120] animate-in slide-in-from-bottom-full shadow-[0_-12px_40px_rgba(0,0,0,0.15)]">
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{cartCount} Items Selected</span>
                <span className="text-xl font-black text-indigo-600 leading-none">{business.currency}{cartTotal.toFixed(0)}</span>
             </div>
             <button 
               onClick={handleCheckout}
               className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border-4 border-white shadow-xl active:scale-95 transition flex items-center gap-2"
             >
               Checkout Now <ArrowRight size={16} strokeWidth={3} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
