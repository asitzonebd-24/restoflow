
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, RefreshCw, Plus, Edit2, X, Save, Search, ChevronRight, CheckCircle, MoreHorizontal, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Inventory = () => {
  const { inventory, updateInventory, addInventoryItem, editInventoryItem, deleteInventoryItem, currentTenant, menu } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'menu'>('inventory');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    materialDetails: '',
    unit: 'kg',
    quantity: 0,
    minThreshold: 5,
    pricePerUnit: 0,
    menuItemId: '',
    menuCategory: ''
  });

  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(1);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', supplier: '', materialDetails: '', unit: 'kg', quantity: 0, minThreshold: 5, pricePerUnit: 0, menuItemId: '', menuCategory: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    const linkedMenu = menu.find(m => m.id === item.menuItemId);
    setFormData({ 
      name: item.name, 
      supplier: item.supplier, 
      materialDetails: item.materialDetails || '',
      unit: item.unit, 
      quantity: item.quantity, 
      minThreshold: item.minThreshold, 
      pricePerUnit: item.pricePerUnit,
      menuItemId: item.menuItemId || '',
      menuCategory: item.menuCategory || linkedMenu?.category || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteInventoryItem(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const data = {
      ...formData,
      menuItemId: formData.menuItemId || null,
      menuCategory: formData.menuCategory || null
    };

    if (editingItem) {
      editInventoryItem(editingItem.id, data);
    } else {
      const newItem: InventoryItem = { id: `inv-${Date.now()}`, ...data, tenantId: currentTenant.id };
      addInventoryItem(newItem);
    }
    setIsModalOpen(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockItem) {
      updateInventory(restockItem.id, restockQuantity);
      setRestockItem(null);
      setRestockQuantity(1);
    }
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  const uniqueMaterialNames = Array.from(new Set(inventory.map(i => i.name))).filter(Boolean);
  const uniqueSuppliers = Array.from(new Set(inventory.map(i => i.supplier))).filter(Boolean);

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

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Raw Materials
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Menu Stock Sync
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
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
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked Menu Item</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredInventory.map(item => {
                      const isLow = item.quantity <= item.minThreshold;
                      const linkedMenu = menu.find(m => m.id === item.menuItemId);
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
                                {item.materialDetails && (
                                  <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={item.materialDetails}>
                                    {item.materialDetails}
                                  </p>
                                )}
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
                            {linkedMenu ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                  <ChevronRight size={14} />
                                </div>
                                <span className="text-xs font-bold text-slate-600">{linkedMenu.name}</span>
                              </div>
                            ) : item.menuCategory ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                  <RefreshCw size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-600">Category: {item.menuCategory}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Not Linked</span>
                            )}
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
                            <div className="flex justify-end gap-2 transition-all">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 transition-all"
                                title="Edit Item"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setRestockItem(item);
                                  setRestockQuantity(1);
                                }}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 shadow-sm border border-slate-100 transition-all"
                                title="Add Stock"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 transition-all"
                                title="Delete Item"
                              >
                                <Trash2 size={16} />
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {currentTenant?.menuCategories.map(category => {
            const categoryItems = menu.filter(m => m.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <div key={category} className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                <div className="px-8 py-6 bg-slate-50/50 border-b-2 border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{category}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{categoryItems.length} Items</span>
                </div>
                <div className="divide-y-2 divide-slate-50">
                  {categoryItems.map(item => {
                    const linkedInv = inventory.find(inv => 
                      inv.menuItemId === item.id || 
                      (inv.menuCategory === item.category && !inv.menuItemId)
                    );
                    const isOutOfStock = item.stock === 0;
                    return (
                      <div key={item.id} className="px-8 py-6 flex items-center justify-between group hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {linkedInv ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <RefreshCw size={10} />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">
                                    Synced with {linkedInv.name} 
                                    {linkedInv.menuCategory === item.category && !linkedInv.menuItemId ? ' (Category)' : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Manual Stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3 mb-1">
                            <span className={`text-lg font-bold ${isOutOfStock ? 'text-rose-600' : 'text-slate-900'}`}>
                              {item.stock ?? 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Stock</span>
                          </div>
                          {isOutOfStock && (
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden border-2 border-indigo-500 shadow-indigo-100 self-end md:self-center max-h-[90vh] flex flex-col"
            >
              <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
                <div className="flex justify-between items-center mb-8 shrink-0">
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
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Menu Category (Sync All)</label>
                        <select 
                          value={formData.menuCategory}
                          onChange={(e) => setFormData({...formData, menuCategory: e.target.value, menuItemId: ''})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="">No Category Link</option>
                          {currentTenant?.menuCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Specific Menu Item (Optional)</label>
                        <select 
                          value={formData.menuItemId}
                          onChange={(e) => setFormData({...formData, menuItemId: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="">No Specific Item Link</option>
                          {menu
                            .filter(m => !formData.menuCategory || m.category === formData.menuCategory)
                            .map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                      </div>
                      <p className="md:col-span-2 text-[9px] text-slate-400 mt-2 ml-1 italic">
                        Linking to a category will sync stock for ALL items in that category. 
                        Linking to a specific item overrides category sync for that item.
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Material Name</label>
                      <input 
                        type="text" 
                        required
                        list="material-names"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Basmati Rice"
                      />
                      <datalist id="material-names">
                        {uniqueMaterialNames.map((name, idx) => (
                          <option key={idx} value={name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier</label>
                      <input 
                        type="text" 
                        required
                        list="supplier-names"
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Metro Wholesale"
                      />
                      <datalist id="supplier-names">
                        {uniqueSuppliers.map((supplier, idx) => (
                          <option key={idx} value={supplier} />
                        ))}
                      </datalist>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Material Details</label>
                      <textarea 
                        value={formData.materialDetails}
                        onChange={(e) => setFormData({...formData, materialDetails: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        placeholder="e.g. Grade A, Organic, etc."
                        rows={2}
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

      {/* Restock Modal */}
      <AnimatePresence>
        {restockItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Stock</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Restock {restockItem.name}</p>
                  </div>
                  <button 
                    onClick={() => setRestockItem(null)}
                    className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-8 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                      <p className="text-sm font-medium text-slate-900">{restockItem.supplier || 'N/A'}</p>
                    </div>
                    {restockItem.materialDetails && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Details</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{restockItem.materialDetails}</p>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleRestockSubmit}>
                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantity to Add ({restockItem.unit})</label>
                    <input 
                      type="number" 
                      required
                      min="0.01"
                      step="0.01"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(parseFloat(e.target.value))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setRestockItem(null)}
                      className="flex-1 py-4 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <RefreshCw size={16} />
                      Add Stock
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
