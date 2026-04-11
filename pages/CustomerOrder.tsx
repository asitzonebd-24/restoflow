
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, OrderItem, Order, OrderStatus } from '../types';
import { ShoppingBasket, Plus, Minus, Search, ArrowRight, LogOut, MapPin, Menu as MenuIcon, X, ShoppingCart, Timer, History, ShoppingBag, CheckCircle, FileText, ChevronRight, Store, User as UserCircle, Utensils, ListTree } from 'lucide-react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerOrder = () => {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const { menu, business, addOrder, currentUser, logout, updateBusiness, setCurrentTenantId, activeCategory, setActiveCategory, categories } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  
  const [useProfileAddress, setUseProfileAddress] = useState(!!currentUser?.address);
  const [manualAddress, setManualAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const tenantId = urlTenantId || currentUser?.tenantId;

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  const filteredMenu = menu.filter(item => 
    item.isAvailable &&
    (activeCategory !== 'Select Categories' && item.category === activeCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    if (item.stock !== undefined && item.stock !== null && item.stock <= 0) return;
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.itemId === item.id && i.status === OrderStatus.PENDING);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (item.stock !== undefined && item.stock !== null && currentQty >= item.stock) {
          return prev; // Don't add if stock limit reached
        }
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: currentQty + 1
        };
        return newCart;
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

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentUser || isSubmitting) return;
    
    const finalAddress = useProfileAddress ? (currentUser.address || '') : manualAddress;

    if (!finalAddress.trim()) {
      setIsCartOpen(true);
      setTimeout(() => {
        const el = document.querySelector('#address-section');
        el?.scrollIntoView({ behavior: 'smooth' });
        // Brief highlight effect
        el?.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
        setTimeout(() => el?.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50'), 2000);
      }, 300);
      return;
    }

    setIsSubmitting(true);
    try {
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

      await addOrder(newOrder);
      // Explicitly increment the sequence
      await updateBusiness({ nextCustomerToken: sequenceNum + 1 });
      setCart([]);
      navigate(`/${tenantId}/order/panel`);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!business.customerAppEnabled) {
    return <Navigate to={`/${tenantId}/order/auth`} replace />;
  }

  const CartContent = ({ onClose, isEmbedded = false }: { onClose?: () => void, isEmbedded?: boolean }) => (
    <div className={`flex flex-col ${isEmbedded ? 'h-auto' : 'h-full'} bg-white lg:border-l-4 border-indigo-500 shadow-2xl shadow-indigo-100`}>
      <div className="p-6 border-b-4 border-indigo-500 bg-slate-50 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
             <ShoppingBasket size={24} strokeWidth={3} /> {isEmbedded ? 'Your Selection' : 'Basket'}
          </h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className={`${isEmbedded ? 'h-auto' : 'flex-1 overflow-y-auto'} p-4 md:p-6 space-y-4 no-scrollbar`}>
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center text-slate-200"
            >
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="font-black uppercase text-[10px] tracking-[0.3em]">No items added</p>
            </motion.div>
          ) : (
            cart.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.rowId} 
                className="bg-white p-4 rounded-[1.5rem] border-2 border-indigo-500 flex justify-between items-center shadow-xl shadow-indigo-100 group"
              >
                <div className="min-w-0 pr-4">
                    <h4 className="font-black text-[10px] md:text-[11px] uppercase truncate">{item.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{business.currency}{item.price.toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border-2 border-slate-200 shadow-inner group-hover:bg-white transition-colors">
                    <button onClick={() => updateQuantity(item.itemId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Minus size={12} strokeWidth={4}/></button>
                    <span className="font-black text-[12px] w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.itemId, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white rounded-lg transition active:scale-90"><Plus size={12} strokeWidth={4}/></button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div id="address-section" className="p-6 border-t-8 border-indigo-500 bg-slate-50 shrink-0 transition-all duration-500 space-y-6">
        <div className="space-y-4">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-2">
            <MapPin size={12} /> Delivery Destination
          </label>
          
          <div className="flex flex-col gap-2">
            {currentUser?.address && (
              <button 
                onClick={() => setUseProfileAddress(true)}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${useProfileAddress ? 'border-indigo-500 bg-indigo-50 shadow-xl shadow-indigo-100' : 'border-slate-100 bg-white shadow-sm'}`}
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
              className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${!useProfileAddress ? 'border-indigo-500 bg-indigo-50 shadow-xl shadow-indigo-100' : 'border-slate-100 bg-white shadow-sm'}`}
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
              className="w-full p-4 border-2 border-indigo-500 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-xl shadow-indigo-100"
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <FileText size={12} /> Special Instructions
          </label>
          <textarea 
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Any special requests?"
            className="w-full p-4 bg-white border-2 border-indigo-500 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100 h-20 resize-none"
          />
        </div>
        
        <div className="flex justify-between items-center">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-widest leading-none">Subtotal</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{business.currency}{cartTotal.toFixed(0)}</span>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-30 border-2 border-indigo-500"
        >
          {isSubmitting ? 'Processing...' : 'Finalize Order'} <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden relative">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 flex flex-col gap-3">
              <div className="relative group flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border-2 border-indigo-500 rounded-xl font-black uppercase text-[10px] outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="bg-white border-2 border-indigo-500 rounded-xl font-black uppercase text-[10px] outline-none focus:ring-4 focus:ring-indigo-500/10 transition px-2"
                >
                  <option value="Select Categories">Select Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-right flex items-center gap-4 shrink-0">
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Basket</p>
                <p className="font-black text-indigo-600 leading-none">{business.currency}{cartTotal.toFixed(0)}</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0 no-scrollbar">
          <div className="flex-none lg:flex-1 p-4 md:p-8 lg:overflow-y-auto no-scrollbar pb-12 lg:pb-32 min-h-0">
            {activeCategory !== 'Select Categories' && filteredMenu.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <MenuIcon size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase text-[10px] tracking-[0.3em]">No items found</p>
              </div>
            ) : activeCategory !== 'Select Categories' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
                {filteredMenu.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className={`group flex flex-col bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-black p-3 md:p-5 transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-500 active:scale-95 shadow-xl shadow-slate-200/20 relative overflow-hidden ${item.stock !== undefined && item.stock !== null && item.stock <= 0 ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-slate-100 mb-3 md:mb-5 bg-slate-50 flex items-center justify-center group-hover:border-indigo-500 transition-colors relative">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.stock !== undefined && item.stock !== null && item.stock <= 0 ? 'grayscale opacity-50' : ''}`} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ShoppingBag size={32} className="text-slate-200" />
                        )}
                        {item.stock !== undefined && item.stock !== null && item.stock <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                            <span className="bg-rose-600 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl transform -rotate-6 border-2 border-white/20">
                              Sold Out
                            </span>
                          </div>
                        )}
                    </div>
                    <h3 className="font-black text-[10px] md:text-[12px] uppercase tracking-tight text-slate-900 text-left line-clamp-2 leading-tight mb-2 h-7 md:h-8">{item.name}</h3>
                    <div className="mt-auto flex justify-between items-center w-full">
                        <span className="font-black text-indigo-600 text-xs md:text-base">{business.currency}{item.price.toFixed(0)}</span>
                        {item.stock !== undefined && item.stock !== null && item.stock <= 0 ? (
                          <div className="bg-slate-100 text-slate-300 p-1.5 md:p-2 rounded-xl border-2 border-slate-100"><X size={14} strokeWidth={4} /></div>
                        ) : (
                          <div className="bg-black text-white p-1.5 md:p-2 rounded-xl border-2 border-black"><Plus size={14} strokeWidth={4} /></div>
                        )}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Mobile Embedded Basket - Visible below menu items */}
            {cart.length > 0 && (
              <div className={`lg:hidden ${activeCategory !== 'Select Categories' ? 'mt-12' : 'mt-4'} mb-20`}>
                <CartContent isEmbedded />
              </div>
            )}
          </div>

          <div className="hidden lg:flex w-[400px] bg-white border-l-8 border-indigo-500 flex-col shadow-2xl shrink-0 overflow-y-auto no-scrollbar">
             <CartContent />
          </div>
        </div>

        {/* Persistent Checkout Bar Removed as per request - User can scroll to embedded basket */}

        {/* Mobile Cart Overlay */}
        <AnimatePresence>
          {isCartOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-[85%] max-w-md"
              >
                <CartContent onClose={() => setIsCartOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
