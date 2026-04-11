
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryMode, Recipe } from '../types';
import { Package, AlertTriangle, RefreshCw, Plus, Edit2, X, Save, Search, ChevronRight, CheckCircle, MoreHorizontal, ArrowUpRight, ArrowDownRight, Trash2, Truck, List, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '../components/Pagination';

const ListManagerModal = ({ 
  isOpen, 
  onClose, 
  title, 
  items, 
  onAdd, 
  onDelete, 
  placeholder 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  items: string[]; 
  onAdd: (item: string) => void; 
  onDelete: (item: string) => void; 
  placeholder: string; 
}) => {
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]"
        >
          <div className="p-8 md:p-10 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Manage your predefined list</p>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-8 md:p-10 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
              <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder={placeholder}
              />
              <button 
                type="submit"
                disabled={!newItem.trim()}
                className="px-6 py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </form>

            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">No items added yet.</p>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <button 
                      onClick={() => onDelete(item)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const Inventory = () => {
  const { inventory, updateInventory, addInventoryItem, editInventoryItem, deleteInventoryItem, currentTenant, menu, updateTenant, business, recipes, addRecipe, updateRecipe, deleteRecipe, addExpense } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isMaterialManagerOpen, setIsMaterialManagerOpen] = useState(false);
  const [isSupplierManagerOpen, setIsSupplierManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'menu' | 'recipes' | 'suppliers'>('inventory');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [dueAmountChange, setDueAmountChange] = useState<number | ''>('');
  const [dueAction, setDueAction] = useState<'add' | 'pay'>('pay');

  const isRecipeMode = business?.inventoryMode === InventoryMode.RECIPE;

  const uniqueMaterialNames = Array.from(new Set([
    ...(currentTenant?.materialNames || []),
    ...inventory.map(i => i.name)
  ])).filter(Boolean);

  const uniqueSuppliers = Array.from(new Set([
    ...(currentTenant?.suppliers || []),
    ...inventory.map(i => i.supplier)
  ])).filter(Boolean);

  const [menuFilterCategory, setMenuFilterCategory] = useState<string>('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);

  const [recipeFormData, setRecipeFormData] = useState<{
    menuItemId: string;
    ingredients: { inventoryItemId: string; quantity: number }[];
  }>({
    menuItemId: '',
    ingredients: [{ inventoryItemId: '', quantity: 0 }]
  });

  const [formData, setFormData] = useState<{
    name: string;
    supplier: string;
    unit: string;
    quantity: number;
    minThreshold: number;
    pricePerUnit: number;
    menuItemIds: string[];
  }>({
    name: '',
    supplier: '',
    unit: 'kg',
    quantity: 0,
    minThreshold: 5,
    pricePerUnit: 0,
    menuItemIds: []
  });

  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(1);
  const [restockPaidAmount, setRestockPaidAmount] = useState<number | ''>('');
  const [newStock, setNewStock] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');

  const existingItemForForm = editingItem || (!isCustomMaterial ? inventory.find(item => item.name === formData.name) : null);
  const finalQuantityUI = formData.quantity + (Number(newStock) || 0);
  const expenseQuantityUI = Math.max(0, finalQuantityUI - (existingItemForForm ? existingItemForForm.quantity : 0));
  const totalAmountUI = expenseQuantityUI * formData.pricePerUnit;

  const openAddModal = () => {
    setEditingItem(null);
    setNewStock('');
    setPaidAmount('');
    setMenuFilterCategory('');
    setIsCustomMaterial(false);
    setIsCustomSupplier(false);
    setFormData({ name: '', supplier: '', unit: 'kg', quantity: 0, minThreshold: 5, pricePerUnit: 0, menuItemIds: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setNewStock('');
    setPaidAmount('');
    setMenuFilterCategory('');
    setIsCustomMaterial(!uniqueMaterialNames.includes(item.name));
    setIsCustomSupplier(!uniqueSuppliers.includes(item.supplier));
    setFormData({ 
      name: item.name, 
      supplier: item.supplier, 
      unit: item.unit, 
      quantity: item.quantity, 
      minThreshold: item.minThreshold, 
      pricePerUnit: item.pricePerUnit,
      menuItemIds: item.menuItemIds || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteInventoryItem(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const paid = Number(paidAmount) || 0;
    const due = totalAmountUI - paid;

    const data = {
      ...formData,
      quantity: finalQuantityUI,
      menuItemIds: formData.menuItemIds.length > 0 ? formData.menuItemIds : undefined
    };

    if (existingItemForForm) {
      editInventoryItem(existingItemForForm.id, data);
    } else {
      const newItem: InventoryItem = { id: `inv-${Date.now()}`, ...data, tenantId: currentTenant.id };
      addInventoryItem(newItem);
    }

    // Handle Expense and Supplier Due
    if (expenseQuantityUI > 0 && formData.supplier.trim()) {
      if (paid > 0) {
        await addExpense({
          id: `exp-${Date.now()}`,
          title: `Stock Purchase: ${formData.name}`,
          amount: paid,
          category: 'Inventory',
          date: new Date().toISOString(),
          recordedBy: 'System',
          note: `Purchased ${expenseQuantityUI} ${formData.unit} from ${formData.supplier}`
        });
      }

      if (due > 0) {
        const currentDues = currentTenant.supplierDues || {};
        const currentDue = currentDues[formData.supplier.trim()] || 0;
        await updateTenant(currentTenant.id, {
          supplierDues: {
            ...currentDues,
            [formData.supplier.trim()]: currentDue + due
          }
        });
      }
    }

    // Auto-save new material names and suppliers
    const updates: any = {};
    const currentMaterials = currentTenant.materialNames || [];
    const currentSuppliers = currentTenant.suppliers || [];
    
    if (formData.name.trim() && !currentMaterials.includes(formData.name.trim())) {
      updates.materialNames = [...currentMaterials, formData.name.trim()];
    }
    if (formData.supplier.trim() && !currentSuppliers.includes(formData.supplier.trim())) {
      updates.suppliers = [...currentSuppliers, formData.supplier.trim()];
    }
    
    if (Object.keys(updates).length > 0) {
      await updateTenant(currentTenant.id, updates);
    }

    setIsModalOpen(false);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !restockItem) return;

    const totalAmount = restockQuantity * restockItem.pricePerUnit;
    const paid = Number(restockPaidAmount) || 0;
    const due = totalAmount - paid;

    updateInventory(restockItem.id, restockQuantity);

    // Handle Expense and Supplier Due
    if (restockQuantity > 0 && restockItem.supplier.trim()) {
      if (paid > 0) {
        await addExpense({
          id: `exp-${Date.now()}`,
          title: `Stock Purchase: ${restockItem.name}`,
          amount: paid,
          category: 'Inventory',
          date: new Date().toISOString(),
          recordedBy: 'System',
          note: `Purchased ${restockQuantity} ${restockItem.unit} from ${restockItem.supplier}`
        });
      }

      if (due > 0) {
        const currentDues = currentTenant.supplierDues || {};
        const currentDue = currentDues[restockItem.supplier.trim()] || 0;
        await updateTenant(currentTenant.id, {
          supplierDues: {
            ...currentDues,
            [restockItem.supplier.trim()]: currentDue + due
          }
        });
      }
    }

    setRestockItem(null);
    setRestockQuantity(1);
    setRestockPaidAmount('');
  };

  const handleAddMaterial = async (name: string) => {
    if (!currentTenant || !name.trim()) return;
    const currentList = currentTenant.materialNames || [];
    if (!currentList.includes(name.trim())) {
      await updateTenant(currentTenant.id, {
        materialNames: [...currentList, name.trim()]
      });
    }
  };

  const handleDeleteMaterial = async (name: string) => {
    if (!currentTenant) return;
    const currentList = currentTenant.materialNames || [];
    await updateTenant(currentTenant.id, {
      materialNames: currentList.filter(n => n !== name)
    });
  };

  const handleAddSupplier = async (name: string) => {
    if (!currentTenant || !name.trim()) return;
    const currentList = currentTenant.suppliers || [];
    if (!currentList.includes(name.trim())) {
      await updateTenant(currentTenant.id, {
        suppliers: [...currentList, name.trim()]
      });
    }
  };

  const handleDeleteSupplier = async (name: string) => {
    if (!currentTenant) return;
    const currentList = currentTenant.suppliers || [];
    await updateTenant(currentTenant.id, {
      suppliers: currentList.filter(n => n !== name)
    });
  };

  const filteredInventory = inventory.filter(i => {
    const matchesSupplier = filterSupplier === 'all' || i.supplier === filterSupplier;
    const isLowStock = i.quantity <= i.minThreshold;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'low' && isLowStock) || (filterStatus === 'healthy' && !isLowStock);
    return matchesSupplier && matchesStatus;
  });

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    const data = {
      menuItemId: recipeFormData.menuItemId,
      ingredients: recipeFormData.ingredients.filter(i => i.inventoryItemId && i.quantity > 0)
    };

    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, data);
    } else {
      await addRecipe({
        id: `recipe-${Date.now()}`,
        ...data
      });
    }
    setIsRecipeModalOpen(false);
  };

  const openAddRecipeModal = () => {
    setEditingRecipe(null);
    setRecipeFormData({ menuItemId: '', ingredients: [{ inventoryItemId: '', quantity: 0 }] });
    setIsRecipeModalOpen(true);
  };

  const openEditRecipeModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeFormData({
      menuItemId: recipe.menuItemId,
      ingredients: recipe.ingredients.map(i => ({ ...i }))
    });
    setIsRecipeModalOpen(true);
  };

  const addIngredientField = () => {
    setRecipeFormData({
      ...recipeFormData,
      ingredients: [...recipeFormData.ingredients, { inventoryItemId: '', quantity: 0 }]
    });
  };

  const removeIngredientField = (index: number) => {
    const newIngredients = [...recipeFormData.ingredients];
    newIngredients.splice(index, 1);
    setRecipeFormData({ ...recipeFormData, ingredients: newIngredients });
  };

  const updateIngredientField = (index: number, field: 'inventoryItemId' | 'quantity', value: string | number) => {
    const newIngredients = [...recipeFormData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipeFormData({ ...recipeFormData, ingredients: newIngredients });
  };

  const handleDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !selectedSupplier || dueAmountChange === '') return;

    try {
      const currentDues = currentTenant.supplierDues || {};
      const currentDue = currentDues[selectedSupplier] || 0;
      
      let newDue = currentDue;
      if (dueAction === 'add') {
        newDue += Number(dueAmountChange);
      } else {
        newDue -= Number(dueAmountChange);
      }

      await updateTenant(currentTenant.id, {
        supplierDues: {
          ...currentDues,
          [selectedSupplier]: newDue
        }
      });

      setIsDueModalOpen(false);
      setSelectedSupplier(null);
      setDueAmountChange('');
    } catch (error) {
      console.error('Error updating supplier due:', error);
      alert('Failed to update supplier due amount');
    }
  };

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventory, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSupplier, filterStatus]);

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
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsMaterialManagerOpen(true)}
            className="w-full md:w-auto bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <List size={18} /> Materials
          </button>
          <button 
            onClick={() => setIsSupplierManagerOpen(true)}
            className="w-full md:w-auto bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Truck size={18} /> Suppliers
          </button>
          <button 
            onClick={openAddModal}
            className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus size={18} /> Add Stock Item
          </button>
        </div>
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

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <select 
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="flex-1 px-6 py-4 bg-white border-2 border-indigo-500 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100 appearance-none"
        >
          <option value="all">All Suppliers</option>
          {uniqueSuppliers.map(supplier => (
            <option key={supplier} value={supplier}>{supplier}</option>
          ))}
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 px-6 py-4 bg-white border-2 border-indigo-500 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-indigo-100 appearance-none"
        >
          <option value="all">All Status</option>
          <option value="healthy">Healthy Stock</option>
          <option value="low">Low Stock</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Raw Materials
        </button>
        {!isRecipeMode ? (
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
          >
            Menu Stock Sync
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab('recipes')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'recipes' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
          >
            Recipes
          </button>
        )}
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'suppliers' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          Suppliers
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Inventory Table */}
          <div className="bg-white rounded-[2rem] border border-black shadow-xl shadow-indigo-100 overflow-hidden mb-10">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-black">
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Material Details</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Supplier</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Unit Price</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Current Stock</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Linked Menu Item</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-black">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <AnimatePresence mode="popLayout">
                    {paginatedInventory.map(item => {
                      const isLow = item.quantity <= item.minThreshold;
                      const linkedMenus = item.menuItemIds ? menu.filter(m => item.menuItemIds!.includes(m.id)) : [];
                      return (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={item.id} 
                          className="hover:bg-slate-50/30 transition-colors group"
                        >
                          <td className="px-8 py-6 border-r border-black">
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
                          <td className="px-8 py-6 border-r border-black">
                            <span className="text-xs font-bold text-slate-600">{item.supplier}</span>
                          </td>
                          <td className="px-8 py-6 border-r border-black">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{currentTenant?.currency}{item.pricePerUnit.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Per {item.unit}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 border-r border-black">
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 border-r border-black">
                            {linkedMenus.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {linkedMenus.map(lm => (
                                  <div key={lm.id} className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                      <ChevronRight size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{lm.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Not Linked</span>
                            )}
                          </td>
                          <td className="px-8 py-6 border-r border-black">
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-black">
              {paginatedInventory.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                const linkedMenus = item.menuItemIds ? menu.filter(m => item.menuItemIds!.includes(m.id)) : [];
                return (
                  <div key={item.id} className="p-6 hover:bg-slate-50/30 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isLow ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {item.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setRestockItem(item);
                            setRestockQuantity(1);
                          }}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 shadow-sm border border-slate-100"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Stock Level</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Unit Price</p>
                        <span className="text-sm font-bold text-slate-900">{currentTenant?.currency}{item.pricePerUnit.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Supplier:</p>
                        <span className="text-[10px] font-bold text-slate-600">{item.supplier}</span>
                      </div>
                      {isLow ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                          <AlertTriangle size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Low</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                          <CheckCircle size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">OK</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredInventory.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No items found</p>
              </div>
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredInventory.length}
            itemsPerPage={itemsPerPage}
          />
        </>
      ) : activeTab === 'menu' ? (
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
                      inv.menuItemIds?.includes(item.id)
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
      ) : activeTab === 'recipes' ? (
        <div className="space-y-6 mb-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Menu Recipes</h2>
            <button 
              onClick={openAddRecipeModal}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} /> Create Recipe
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
              <div className="md:col-span-3 py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <List size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No recipes created yet</p>
                <button onClick={openAddRecipeModal} className="mt-4 text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline">Add your first recipe</button>
              </div>
            ) : (
              recipes.map(recipe => {
                const menuItem = menu.find(m => m.id === recipe.menuItemId);
                return (
                  <div key={recipe.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-indigo-500 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          {menuItem?.image ? (
                            <img src={menuItem.image} alt={menuItem.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{menuItem?.name || 'Unknown Item'}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{recipe.ingredients.length} Ingredients</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditRecipeModal(recipe)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => { if(window.confirm('Delete recipe?')) deleteRecipe(recipe.id) }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {recipe.ingredients.slice(0, 3).map((ing, idx) => {
                        const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">{invItem?.name || 'Unknown'}</span>
                            <span className="text-slate-900 font-bold">{ing.quantity} {invItem?.unit}</span>
                          </div>
                        );
                      })}
                      {recipe.ingredients.length > 3 && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">+{recipe.ingredients.length - 3} more ingredients</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 mb-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Supplier Dues</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(!currentTenant?.suppliers || currentTenant.suppliers.length === 0) ? (
              <div className="md:col-span-3 py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No suppliers added yet</p>
                <p className="mt-2 text-[10px] text-slate-400">Add suppliers when creating inventory items</p>
              </div>
            ) : (
              currentTenant.suppliers.map(supplier => {
                const dueAmount = currentTenant.supplierDues?.[supplier] || 0;
                return (
                  <div key={supplier} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-indigo-500 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Users size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{supplier}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t-2 border-slate-50">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Due Amount</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {currentTenant.currency}{dueAmount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setDueAction('pay');
                            setIsDueModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                          Manage Due
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Supplier Due Modal */}
      <AnimatePresence>
        {isDueModalOpen && selectedSupplier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-50/50 border-b-2 border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Manage Due</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">{selectedSupplier}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsDueModalOpen(false);
                    setSelectedSupplier(null);
                    setDueAmountChange('');
                  }}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleDueSubmit} className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Action</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setDueAction('pay')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dueAction === 'pay' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' : 'bg-slate-50 text-slate-400 border-2 border-transparent hover:bg-slate-100'}`}
                      >
                        Pay Due
                      </button>
                      <button
                        type="button"
                        onClick={() => setDueAction('add')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${dueAction === 'add' ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-slate-50 text-slate-400 border-2 border-transparent hover:bg-slate-100'}`}
                      >
                        Add Due
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount ({currentTenant?.currency})</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      required
                      value={dueAmountChange}
                      onChange={(e) => setDueAmountChange(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Confirm {dueAction === 'pay' ? 'Payment' : 'Addition'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="relative bg-white w-full max-w-2xl md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden border-2 border-indigo-500 shadow-indigo-100 self-end md:self-center max-h-[90vh] flex flex-col"
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
                  {/* Basic Details */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} className="text-indigo-500" /> Item Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Material Name</label>
                        {!isCustomMaterial ? (
                          <>
                            <select 
                              required
                              value={formData.name}
                              onChange={(e) => {
                                if (e.target.value === '__NEW__') {
                                  setIsCustomMaterial(true);
                                  setFormData({...formData, name: '', quantity: 0});
                                } else {
                                  const selectedName = e.target.value;
                                  const existing = inventory.find(item => item.name === selectedName);
                                  if (existing && !editingItem) {
                                    setFormData({
                                      name: existing.name,
                                      quantity: existing.quantity,
                                      unit: existing.unit,
                                      supplier: existing.supplier,
                                      pricePerUnit: existing.pricePerUnit,
                                      minThreshold: existing.minThreshold,
                                      menuItemIds: existing.menuItemIds || []
                                    });
                                  } else {
                                    setFormData({...formData, name: selectedName});
                                  }
                                }
                              }}
                              className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all appearance-none shadow-sm"
                            >
                              <option value="" disabled>Select Material...</option>
                              {uniqueMaterialNames.map((name, idx) => (
                                <option key={idx} value={name}>{name}</option>
                              ))}
                              <option value="__NEW__" className="font-bold text-indigo-600">+ Add New Material</option>
                            </select>
                            {(() => {
                              if (formData.name && !isCustomMaterial) {
                                const existingItems = inventory.filter(item => item.name === formData.name);
                                if (existingItems.length > 0) {
                                  const totalStock = existingItems.reduce((sum, item) => sum + item.quantity, 0);
                                  return (
                                    <p className="text-[10px] font-bold text-indigo-600 mt-2 ml-1">
                                      Current Total Stock: {totalStock} {existingItems[0].unit}
                                    </p>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="flex-1 px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                              placeholder="Enter new material name"
                              autoFocus
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                setIsCustomMaterial(false);
                                setFormData({...formData, name: ''});
                              }}
                              className="px-4 py-3.5 bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier</label>
                        {!isCustomSupplier ? (
                          <select 
                            required
                            value={formData.supplier}
                            onChange={(e) => {
                              if (e.target.value === '__NEW__') {
                                setIsCustomSupplier(true);
                                setFormData({...formData, supplier: ''});
                              } else {
                                setFormData({...formData, supplier: e.target.value});
                              }
                            }}
                            className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all appearance-none shadow-sm"
                          >
                            <option value="" disabled>Select Supplier...</option>
                            {uniqueSuppliers.map((supplier, idx) => (
                              <option key={idx} value={supplier}>{supplier}</option>
                            ))}
                            <option value="__NEW__" className="font-bold text-indigo-600">+ Add New Supplier</option>
                          </select>
                        ) : (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              value={formData.supplier}
                              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                              className="flex-1 px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                              placeholder="Enter new supplier name"
                              autoFocus
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                setIsCustomSupplier(false);
                                setFormData({...formData, supplier: ''});
                              }}
                              className="px-4 py-3.5 bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit</label>
                        <select 
                          value={formData.unit}
                          onChange={(e) => setFormData({...formData, unit: e.target.value})}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all appearance-none shadow-sm"
                        >
                          <option value="kg">Kilograms (kg)</option>
                          <option value="ltr">Liters (ltr)</option>
                          <option value="pcs">Pieces (pcs)</option>
                          <option value="box">Boxes (box)</option>
                          <option value="pkt">Packets (pkt)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Min Threshold (Alert)</label>
                        <input 
                          type="number" 
                          required
                          value={formData.minThreshold}
                          onChange={(e) => setFormData({...formData, minThreshold: parseFloat(e.target.value)})}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock & Pricing */}
                  <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-50 space-y-5">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                      <Plus size={14} className="text-indigo-500" /> Stock & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Price per Unit</label>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={formData.pricePerUnit}
                          onChange={(e) => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Quantity</label>
                        <input 
                          type="number" 
                          required
                          value={formData.quantity + (Number(newStock) || 0)}
                          onChange={(e) => {
                            setFormData({...formData, quantity: parseFloat(e.target.value) || 0});
                            setNewStock('');
                          }}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 ml-1">Add New Stock</label>
                        <input 
                          type="number" 
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value ? parseFloat(e.target.value) : '')}
                          className="w-full px-5 py-3.5 bg-emerald-50 border-[0.5px] border-black rounded-2xl text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-black transition-all placeholder:text-emerald-300 shadow-sm"
                          placeholder="+0"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-5 border-t border-indigo-100/50 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Amount</label>
                        <div className="w-full px-5 py-3.5 bg-slate-100 border-[0.5px] border-black rounded-2xl text-sm font-bold text-slate-600 shadow-inner">
                          {currentTenant?.currency}{totalAmountUI.toFixed(2)}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 ml-1 italic">Calculated from Add New Stock (or Current Qty if new) × Price</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Paid Amount (Expense)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value ? parseFloat(e.target.value) : '')}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                          placeholder="Enter amount paid now"
                        />
                        {totalAmountUI - (Number(paidAmount) || 0) > 0 && (
                          <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1">
                            Due: {currentTenant?.currency}{(totalAmountUI - (Number(paidAmount) || 0)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Sync */}
                  <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-50 space-y-5">
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw size={14} className="text-amber-500" /> Menu Sync (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Menu Category (Filter)</label>
                        <select 
                          value={menuFilterCategory}
                          onChange={(e) => setMenuFilterCategory(e.target.value)}
                          className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-black transition-all appearance-none shadow-sm"
                        >
                          <option value="">All Categories</option>
                          {currentTenant?.menuCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Linked Menu Items</label>
                        <div className="space-y-3">
                          <select 
                            value=""
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (!selectedId) return;
                              if (!formData.menuItemIds.includes(selectedId)) {
                                setFormData({
                                  ...formData, 
                                  menuItemIds: [...formData.menuItemIds, selectedId]
                                });
                              }
                            }}
                            className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-black transition-all appearance-none shadow-sm"
                          >
                            <option value="">Add Menu Item...</option>
                            {menu
                              .filter(m => !menuFilterCategory || m.category === menuFilterCategory)
                              .filter(m => !formData.menuItemIds.includes(m.id))
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock || 0})</option>
                              ))}
                          </select>
                          
                          {formData.menuItemIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.menuItemIds.map(id => {
                                const menuItem = menu.find(m => m.id === id);
                                return menuItem ? (
                                  <div key={id} className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200">
                                    <span>{menuItem.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setFormData({
                                        ...formData,
                                        menuItemIds: formData.menuItemIds.filter(mId => mId !== id)
                                      })}
                                      className="hover:text-amber-900 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
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
                  </div>
                </div>

                <form onSubmit={handleRestockSubmit}>
                  <div className="mb-6">
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

                  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Amount</label>
                      <div className="w-full px-5 py-3.5 bg-slate-100 border-[0.5px] border-black rounded-2xl text-sm font-bold text-slate-600 shadow-inner">
                        {currentTenant?.currency}{(restockQuantity * restockItem.pricePerUnit).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Paid Amount</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={restockPaidAmount}
                        onChange={(e) => setRestockPaidAmount(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-5 py-3.5 bg-white border-[0.5px] border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black transition-all shadow-sm"
                        placeholder="Amount paid"
                      />
                      {(restockQuantity * restockItem.pricePerUnit) - (Number(restockPaidAmount) || 0) > 0 && (
                        <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1">
                          Due: {currentTenant?.currency}{((restockQuantity * restockItem.pricePerUnit) - (Number(restockPaidAmount) || 0)).toFixed(2)}
                        </p>
                      )}
                    </div>
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

      <ListManagerModal
        isOpen={isMaterialManagerOpen}
        onClose={() => setIsMaterialManagerOpen(false)}
        title="Material Names"
        items={currentTenant?.materialNames || []}
        onAdd={handleAddMaterial}
        onDelete={handleDeleteMaterial}
        placeholder="e.g. Basmati Rice"
      />

      <ListManagerModal
        isOpen={isSupplierManagerOpen}
        onClose={() => setIsSupplierManagerOpen(false)}
        title="Suppliers"
        items={currentTenant?.suppliers || []}
        onAdd={handleAddSupplier}
        onDelete={handleDeleteSupplier}
        placeholder="e.g. Metro Wholesale"
      />
      {/* Recipe Modal */}
      <AnimatePresence>
        {isRecipeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRecipeModalOpen(false)}></div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden border-2 border-indigo-500 shadow-indigo-100 self-end md:self-center max-h-[90vh] flex flex-col"
            >
              <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{editingRecipe ? 'Edit Recipe' : 'Create Recipe'}</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Link raw materials to menu items</p>
                  </div>
                  <button onClick={() => setIsRecipeModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleRecipeSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Select Menu Item</label>
                    <select 
                      required
                      value={recipeFormData.menuItemId}
                      onChange={(e) => setRecipeFormData({ ...recipeFormData, menuItemId: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Choose an item...</option>
                      {menu.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ingredients & Quantities</label>
                      <button 
                        type="button"
                        onClick={addIngredientField}
                        className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Ingredient
                      </button>
                    </div>

                    <div className="space-y-4">
                      {recipeFormData.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex-1">
                            <select 
                              required
                              value={ingredient.inventoryItemId}
                              onChange={(e) => updateIngredientField(index, 'inventoryItemId', e.target.value)}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                            >
                              <option value="">Select Material...</option>
                              {inventory.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <input 
                              type="number" 
                              required
                              step="0.001"
                              min="0.001"
                              placeholder="Qty"
                              value={ingredient.quantity || ''}
                              onChange={(e) => updateIngredientField(index, 'quantity', Number(e.target.value))}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                          {recipeFormData.ingredients.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeIngredientField(index)}
                              className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 shrink-0">
                    <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Save size={18} />
                      {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
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
