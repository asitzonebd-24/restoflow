import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { Plus, Edit2, Trash2, X, Save, Utensils, Sparkles, Search, ImageOff, ListTree, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { generateMenuDescription } from '../services/geminiService';

export const MenuManagement = () => {
  const { menu, business, addMenuItem, updateMenuItem, deleteMenuItem, addMenuCategory, renameMenuCategory, deleteMenuCategory, updateMenuCategories } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Select Categories');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Sold Out'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'In Stock' | 'Out of Stock'>('All');

  // Category Management state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Item Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    image: '',
    isAvailable: true,
    stock: 0
  });

  const categories = useMemo(() => business.menuCategories || [], [business.menuCategories]);

  const filteredMenu = menu.filter(item => 
    (activeCategory === 'All' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'All' || (statusFilter === 'Available' ? item.isAvailable : !item.isAvailable)) &&
    (stockFilter === 'All' || (stockFilter === 'In Stock' ? (item.stock === undefined || item.stock > 0) : (item.stock !== undefined && item.stock <= 0)))
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: 0,
      category: categories[0] || '',
      image: '',
      isAvailable: true,
      stock: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image || '',
      isAvailable: item.isAvailable,
      stock: item.stock || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, formData);
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        ...formData
      };
      addMenuItem(newItem);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItem(id);
    }
  };

  // Category Management Logic
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert("Category already exists.");
      return;
    }
    addMenuCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleRenameCategory = (oldName: string) => {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      renameMenuCategory(oldName, newName.trim());
    }
  };

  const handleDeleteCategory = (catName: string) => {
    if (window.confirm(`Delete category "${catName}"? This will move all associated items to "Uncategorized".`)) {
      deleteMenuCategory(catName);
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newCategories.length) return;
    
    // Swap
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    updateMenuCategories(newCategories);
  };

  const handleMagicDescribe = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter Name and Category first.");
      return;
    }
    setIsGenerating(true);
    const desc = await generateMenuDescription(formData.name, formData.category);
    alert(`Gemini Suggests:\n\n"${desc}"`);
    setIsGenerating(false);
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
             <Utensils className="text-indigo-500" size={32} /> Menu Management
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Curate your offerings and manage categories</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setIsCategoryModalOpen(true)}
             className="bg-white border border-slate-100 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
           >
             <ListTree size={16} /> Categories
           </button>
           <button 
             onClick={openAddModal}
             className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
           >
             <Plus size={16} /> Add Item
           </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="mb-10 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search dishes, drinks or categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all shadow-xl shadow-slate-100"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white border-2 border-black px-6 py-4 rounded-3xl shadow-xl shadow-slate-200 flex-1 md:flex-none hover:scale-105 transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
            <p className="text-xl font-bold text-slate-900">{menu.length}</p>
          </div>
          <div className="bg-white border-2 border-black px-6 py-4 rounded-3xl shadow-xl shadow-slate-200 flex-1 md:flex-none hover:scale-105 transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categories</p>
            <p className="text-xl font-bold text-slate-900">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-12 flex flex-wrap gap-4 w-full">
        <div className="relative group flex-1 lg:flex-none">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="w-full lg:w-48 px-6 py-3 bg-white border-2 border-black rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all cursor-pointer"
          >
            <option value="Select Categories">Select Categories</option>
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>

        <div className="relative group flex-1 lg:flex-none">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full lg:w-40 px-6 py-3 bg-white border-2 border-black rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Sold Out">Sold Out</option>
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>

        <div className="relative group flex-1 lg:flex-none">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full lg:w-44 px-6 py-3 bg-white border-2 border-black rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all cursor-pointer"
          >
            <option value="All">All Stock</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="space-y-16">
        {activeCategory === 'Select Categories' ? (
           <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-black shadow-xl shadow-slate-200">
             <ListTree size={64} strokeWidth={1} className="mx-auto text-slate-100 mb-6" />
             <p className="text-slate-300 font-bold uppercase tracking-widest">Please select a category to view items</p>
           </div>
        ) : categories.length === 0 ? (
           <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-black shadow-xl shadow-slate-200">
             <Utensils size={64} strokeWidth={1} className="mx-auto text-slate-100 mb-6" />
             <p className="text-slate-300 font-bold uppercase tracking-widest">Your menu is empty</p>
             <button onClick={openAddModal} className="mt-6 text-indigo-500 font-bold text-sm hover:underline">Create your first dish</button>
           </div>
        ) : categories
            .filter(cat => activeCategory === 'All' || cat === activeCategory)
            .map(cat => {
          const itemsInCat = filteredMenu.filter(m => m.category === cat);
          if (itemsInCat.length === 0 && !searchTerm) return null;
          if (itemsInCat.length === 0 && searchTerm) return null;
          
          return (
            <div key={cat} className="space-y-10">
              <div className="flex items-center gap-6">
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{cat}</h2>
                 <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                 <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-white border-2 border-black px-5 py-2 rounded-full shadow-lg shadow-slate-200/20">{itemsInCat.length} Items</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {itemsInCat.map(item => (
                  <div key={item.id} className="group bg-white rounded-[2rem] border-2 border-black overflow-hidden transition-all hover:shadow-2xl hover:border-slate-700 shadow-xl shadow-slate-200/20 flex flex-col hover:-translate-y-1">
                    <div className="relative h-56 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-slate-50 gap-3">
                          <Utensils size={48} strokeWidth={1} className="text-slate-300" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-slate-400">No Image</span>
                        </div>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                           <span className="text-white text-[10px] font-bold uppercase tracking-widest border border-white/40 px-5 py-2 rounded-full shadow-lg">Sold Out</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-xl hover:bg-slate-50 transition-all active:scale-90"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-xl hover:bg-red-50 transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-7 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{item.name}</h3>
                        <span className="text-indigo-600 font-bold text-lg">
                          {business.currency}{item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-pink-500' : 'bg-red-500'} shadow-sm`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${item.isAvailable ? 'text-pink-600' : 'text-red-600'}`}>
                              {item.isAvailable ? 'Available' : 'Sold Out'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock:</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${item.stock && item.stock > 0 ? 'text-slate-900' : 'text-red-600'}`}>
                              {item.stock !== undefined ? item.stock : '∞'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => updateMenuItem(item.id, { isAvailable: !item.isAvailable })}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors bg-slate-50 px-3 py-2 rounded-lg hover:bg-slate-100 text-center"
                        >
                          Toggle Availability
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-black shadow-slate-200 self-end md:self-center max-h-[90vh] flex flex-col">
            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
                  <p className="text-slate-400 text-sm mt-1">Fill in the details for your dish</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Item Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="e.g. Classic Cheeseburger"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Price ({business.currency})</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <div className="relative">
                        <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                        >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Image URL (Optional)</label>
                    <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                           {formData.image ? (
                             <img 
                               src={formData.image} 
                               alt="Preview" 
                               className="w-full h-full object-cover" 
                             />
                           ) : (
                             <Utensils size={20} className="text-slate-200" />
                           )}
                        </div>
                        <input 
                            type="url" 
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="https://images.unsplash.com/..."
                        />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Stock Quantity (0 for unlimited)</label>
                    <input 
                      type="number" 
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="e.g. 50"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-bold text-slate-700 cursor-pointer">Item is currently available for order</label>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={handleMagicDescribe}
                    disabled={isGenerating}
                    className="flex-1 py-4 rounded-2xl font-bold text-indigo-600 uppercase tracking-widest text-[10px] bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    <Sparkles size={16} /> {isGenerating ? 'Drafting...' : 'AI Describe'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Save size={16} />
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-black shadow-slate-200 self-end md:self-center max-h-[90vh] flex flex-col">
            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Manage Categories</h2>
                  <p className="text-slate-400 text-sm mt-1">Organize your menu structure</p>
                </div>
                <button onClick={() => setIsCategoryModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Add New Category</label>
                  <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="e.g. Desserts"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button 
                        onClick={handleAddCategory}
                        className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                  {categories.map((cat, index) => (
                    <div key={cat} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-black group hover:bg-white hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1 opacity-100 group-hover:opacity-100 transition-all">
                          <button 
                            disabled={index === 0}
                            onClick={() => moveCategory(index, 'up')}
                            className="text-slate-400 hover:text-black disabled:opacity-20 transition-colors"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            disabled={index === categories.length - 1}
                            onClick={() => moveCategory(index, 'down')}
                            className="text-slate-400 hover:text-black disabled:opacity-20 transition-colors"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-slate-700">{cat}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleRenameCategory(cat)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 shadow-sm border border-slate-100 active:scale-90"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                <button 
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="w-full py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg"
                >
                    Done
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};