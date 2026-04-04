import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, MenuItem, OrderStatus } from '../types';
import { Search, Calendar, Filter, ShoppingBag } from 'lucide-react';
import { Pagination } from '../components/Pagination';

export const SalesItems = () => {
  const { orders, menu, currentTenant } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredSales = useMemo(() => {
    if (dateFilter === '' && categoryFilter === '' && itemFilter === '') {
      return [];
    }

    let filtered = orders
      .filter(order => order.status === OrderStatus.COMPLETED)
      .flatMap(order => 
        order.items.map(item => ({
          ...item,
          orderId: order.id,
          createdAt: order.createdAt
        }))
      );

    if (categoryFilter !== '') {
      filtered = filtered.filter(item => {
        const menuItem = menu.find(m => m.id === item.itemId);
        return menuItem?.category === categoryFilter;
      });
    }

    if (itemFilter !== '') {
      filtered = filtered.filter(item => item.itemId === itemFilter);
    }

    if (dateFilter !== 'all' && dateFilter !== '') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt);
            if (isNaN(itemDate.getTime())) return false;
            if (dateFilter === 'today') return itemDate >= startOfToday;
            if (dateFilter === 'week') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return itemDate >= sevenDaysAgo;
            }
            if (dateFilter === 'month') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return itemDate >= thirtyDaysAgo;
            }
            if (dateFilter === 'custom' && customRange.start && customRange.end) {
                const start = new Date(customRange.start);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customRange.end);
                end.setHours(23, 59, 59, 999);
                return itemDate >= start && itemDate <= end;
            }
            return true;
        });
    } else if (dateFilter === '') {
        // If "Select Date" is chosen, we might want to show nothing if no other filters are set
        // But the top-level check already handles the "nothing selected" case.
        // If they select a category but keep "Select Date", should we show data?
        // User said: "select korle sodho tottho dekhabe"
        // Let's assume if dateFilter is empty, we don't filter by date (show all for that category/item)
        // UNLESS they want "Select Date" to mean "Today" but just labeled differently?
        // Actually, Request 6 said: "date filter er oikhane select date add koiro abong ata default rekho jokhon date select korle sodho tottho dekhabe"
        // This means if "Select Date" is active, show NOTHING.
        return [];
    }

    return filtered;
  }, [orders, menu, categoryFilter, itemFilter, dateFilter, customRange]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, itemFilter, dateFilter]);

  const filteredMenuItems = useMemo(() => {
    if (categoryFilter === 'all') return menu;
    return menu.filter(m => m.category === categoryFilter);
  }, [menu, categoryFilter]);

  // Reset item filter when category changes
  useEffect(() => {
    setItemFilter('');
  }, [categoryFilter]);

  const totalQuantity = useMemo(() => filteredSales.reduce((sum, item) => sum + item.quantity, 0), [filteredSales]);

  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number }> = {};
    filteredSales.forEach(item => {
      if (!itemMap[item.itemId]) {
        itemMap[item.itemId] = { name: item.name, quantity: 0 };
      }
      itemMap[item.itemId].quantity += item.quantity;
    });
    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto no-scrollbar border-2 border-black rounded-[2rem]">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
            <ShoppingBag className="text-indigo-500" size={32} /> Sales Items
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Track individual sales</p>
        </div>
        <div className="bg-indigo-50 px-6 py-3 rounded-2xl border-2 border-black">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Quantity</p>
          <p className="text-2xl font-black text-indigo-900">{totalQuantity}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-xl border-2 border-black flex flex-col md:flex-row gap-4">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="">Select Category</option>
            {currentTenant?.menuCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="">Select Item</option>
            {filteredMenuItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="">Select Date</option>
            <option value="today">Today</option>
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <input type="date" value={customRange.start} onChange={(e) => setCustomRange(prev => ({...prev, start: e.target.value}))} className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              <input type="date" value={customRange.end} onChange={(e) => setCustomRange(prev => ({...prev, end: e.target.value}))} className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-2 border-black">
          <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest border-b-2 border-black pb-2">Top 5 Selling Items</h3>
          <div className="space-y-3">
            {topSellingItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700">{item.name}</span>
                <span className="font-black text-indigo-600">{item.quantity}</span>
              </div>
            ))}
            {topSellingItems.length === 0 && <p className="text-xs text-slate-400">No data available</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border-2 border-black overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
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
              {paginatedSales.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 border-b-2 border-black">
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

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-black">
          {paginatedSales.map((item, index) => (
            <div key={index} className="p-6 hover:bg-slate-50/50 border-b-2 border-black">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isNaN(new Date(item.createdAt).getTime()) 
                    ? 'N/A' 
                    : new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty:</span>
                  <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price:</span>
                  <span className="text-sm font-black text-indigo-600">{currentTenant?.currency}{item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredSales.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
