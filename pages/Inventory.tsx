
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, RefreshCw, Plus, Edit2, X, Save, Search, ChevronRight, CheckCircle, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Inventory = () => {
  const { inventory, updateInventory, addInventoryItem, editInventoryItem, currentTenant } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    unit: 'kg',
    quantity: 0,
    minThreshold: 5,
    pricePerUnit: 0
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', supplier: '', unit: 'kg', quantity: 0, minThreshold: 5, pricePerUnit: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, supplier: item.supplier, unit: item.unit, quantity: item.quantity, minThreshold: item.minThreshold, pricePerUnit: item.pricePerUnit });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    if (editingItem) {
      editInventoryItem(editingItem.id, formData);
    } else {
      const newItem: InventoryItem = { id: `inv-${Date.now()}`, ...formData };
      addInventoryItem(newItem);
    }
    setIsModalOpen(false);
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
             <Package className="text-indigo-500" size={32} /> Inventory Manager
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Track stock levels, suppliers and replenishment</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus size={18} /> Add Stock Item
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 relative overflow-hidden group transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="dot-chart">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`dot ${i < (inventory.length % 20) ? 'active-indigo' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{inventory.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active materials</p>
        </div>

        <div className={`bg-white p-6 rounded-[2rem] border-2 shadow-xl relative overflow-hidden group transition-all duration-300 hover:scale-105 ${lowStockCount > 0 ? 'border-rose-500 shadow-rose-100' : 'border-emerald-500 shadow-emerald-100'}`}>
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="dot-chart">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`dot ${i < (lowStockCount % 20) ? 'active-rose' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock</span>
          </div>
          <p className={`text-3xl font-bold tracking-tight ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{lowStockCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Items below threshold</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-500 shadow-xl shadow-emerald-100 relative overflow-hidden group transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="dot-chart">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`dot ${i < 15 ? 'active-emerald' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <RefreshCw size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Value</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentTenant?.currency}{inventory.reduce((sum, i) => sum + (i.pricePerUnit * i.quantity), 0).toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estimated total value</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search materials, suppliers or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border-2 border-indigo-500 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[2rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 overflow-hidden mb-10">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b-2 border-slate-100">
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Material Details</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supplier</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Stock</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredInventory.map(item => {
                  const isLow = item.quantity <= item.minThreshold;
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={item.id} 
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isLow ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {item.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-600">{item.supplier}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{currentTenant?.currency}{item.pricePerUnit.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Per {item.unit}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {isLow ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                            <AlertTriangle size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Low Stock</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <CheckCircle size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Healthy</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => updateInventory(item.id, item.quantity + 1)}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 shadow-sm border border-slate-100 transition-all"
                            title="Quick Restock +1"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredInventory.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300">
            <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No items found</p>
          </div>
        )}
      </div>

      {/* Inventory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-indigo-500 shadow-indigo-100"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{editingItem ? 'Edit Stock Item' : 'New Stock Item'}</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Update your material inventory</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Material Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Basmati Rice"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier</label>
                      <input 
                        type="text" 
                        required
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Metro Wholesale"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit</label>
                      <select 
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ltr">Liters (ltr)</option>
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="box">Boxes (box)</option>
                        <option value="pkt">Packets (pkt)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Price per Unit</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Quantity</label>
                      <input 
                        type="number" 
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Min Threshold (Alert)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.minThreshold}
                        onChange={(e) => setFormData({...formData, minThreshold: parseFloat(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Save size={16} />
                      {editingItem ? 'Update Stock' : 'Create Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
