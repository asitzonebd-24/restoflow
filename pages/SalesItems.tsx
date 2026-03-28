import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Order, MenuItem } from '../types';
import { Search, Calendar, Filter, ShoppingBag } from 'lucide-react';

export const SalesItems = () => {
  const { orders, menu, currentTenant } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredSales = useMemo(() => {
    let filtered = orders.flatMap(order => 
      order.items.map(item => ({
        ...item,
        orderId: order.id,
        createdAt: order.createdAt
      }))
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => {
        const menuItem = menu.find(m => m.id === item.itemId);
        return menuItem?.category === categoryFilter;
      });
    }

    if (itemFilter !== 'all') {
      filtered = filtered.filter(item => item.itemId === itemFilter);
    }

    if (dateFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt);
            if (isNaN(itemDate.getTime())) return false;
            if (dateFilter === 'today') return itemDate >= startOfToday;
            return true;
        });
    }

    return filtered;
  }, [orders, menu, categoryFilter, itemFilter, dateFilter]);

  const filteredMenuItems = useMemo(() => {
    if (categoryFilter === 'all') return menu;
    return menu.filter(m => m.category === categoryFilter);
  }, [menu, categoryFilter]);

  // Reset item filter when category changes
  React.useEffect(() => {
    setItemFilter('all');
  }, [categoryFilter]);

  const totalQuantity = useMemo(() => filteredSales.reduce((sum, item) => sum + item.quantity, 0), [filteredSales]);

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto no-scrollbar">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
            <ShoppingBag className="text-indigo-500" size={32} /> Sales Items
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Track individual sales</p>
        </div>
        <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Quantity</p>
          <p className="text-2xl font-black text-indigo-900">{totalQuantity}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Categories</option>
          {currentTenant?.menuCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select 
          value={itemFilter}
          onChange={(e) => setItemFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Items</option>
          {filteredMenuItems.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Name</th>
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</th>
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</th>
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSales.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50">
                <td className="px-8 py-6 text-sm font-bold text-slate-900">{item.name}</td>
                <td className="px-8 py-6 text-sm text-slate-600">{item.quantity}</td>
                <td className="px-8 py-6 text-sm text-slate-600">{currentTenant?.currency}{item.price.toFixed(2)}</td>
                <td className="px-8 py-6 text-sm text-slate-600">
                  {isNaN(new Date(item.createdAt).getTime()) 
                    ? 'N/A' 
                    : new Date(item.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
