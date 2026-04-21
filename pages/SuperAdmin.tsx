
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Business, Role, BillStatus, InventoryMode } from '../types';
import { Plus, Building2, User, Mail, Phone, Globe, MapPin, Search, ExternalLink, Calendar, Power, PowerOff, Edit3, Save, X as CloseIcon, AlertTriangle, Copy, Check, Wallet, Trash2, ChevronDown, Printer, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const SuperAdmin = () => {
  const { tenants, createBusiness, currentUser, toggleBusinessStatus, updateTenant, deleteTenant, allUsers, updateUser, currentTenant, monthlyBills, setCurrentTenantId } = useApp();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    setCurrentTenantId(null);
  }, [setCurrentTenantId]);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Business | null>(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [bulkMaintenanceMsg, setBulkMaintenanceMsg] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [selectedTenantForPrinter, setSelectedTenantForPrinter] = useState<Business | null>(null);

  const CURRENCIES = ['৳', '$', '€', '£', '₹', '₨', 'AED', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const [newBusiness, setNewBusiness] = useState<Partial<Business>>({
    id: '',
    name: '',
    address: '',
    phone: '',
    currency: '৳',
    themeColor: '#0f172a',
    monthlyBill: 500,
    logo: '',
    vatRate: 0,
    includeVat: false,
    timezone: 'UTC',
    customerTokenPrefix: 'ORD',
    customerAppEnabled: true,
    isMaintenanceMode: false,
    maintenanceMessage: '',
    maintenanceTime: '',
    inventoryMode: InventoryMode.SIMPLE,
  });

  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });

  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingTenant) {
      await updateTenant(editingTenant.id, newBusiness);
      const owner = allUsers.find(u => 
        (String(u.tenantId || '01') === String(editingTenant.id) || (u.tenantIds && u.tenantIds.includes(String(editingTenant.id)))) 
        && u.role === Role.OWNER
      );
      if (owner) {
        await updateUser(owner.id, newOwner);
      }
      resetForm();
      return;
    }

    // Check for global email uniqueness
    const existingUser = allUsers.find(u => u.email.toLowerCase() === newOwner.email.toLowerCase());
    if (existingUser && existingUser.role !== Role.OWNER) {
      setError('This email is already registered for a non-owner account.');
      return;
    }

    // Check for tenant slug uniqueness if provided
    if (newBusiness.slug) {
      const isTenantSlugDuplicate = tenants.some(t => 
        (t.slug?.toLowerCase() === newBusiness.slug?.toLowerCase() || t.id.toLowerCase() === newBusiness.slug?.toLowerCase()) 
        && t.id !== editingTenant?.id
      );
      if (isTenantSlugDuplicate) {
        setError('This slug is already in use.');
        return;
      }
    }

    try {
      const resultId = await createBusiness(newBusiness, newOwner, duplicateSourceId || undefined);
      if (resultId) {
        resetForm();
      }
    } catch (err: any) {
      console.error('Error in handleCreate:', err);
      toast.error('Failed to create business: ' + err.message);
    }
  };

  const handleDuplicateTenant = (tenant: Business) => {
    setDuplicateSourceId(tenant.id);
    setEditingTenant(null);
    setNewBusiness({
      name: '',
      address: '',
      phone: '',
      currency: '৳',
      themeColor: '#0f172a',
      monthlyBill: 500,
      logo: '',
      vatRate: 0,
      includeVat: false,
      timezone: 'UTC',
      customerTokenPrefix: 'ORD',
      customerAppEnabled: true,
      isMaintenanceMode: false,
      maintenanceMessage: '',
      maintenanceTime: '',
      inventoryMode: InventoryMode.SIMPLE,
      menuCategories: tenant.menuCategories || ['Main', 'Starter', 'Beverage', 'Dessert'],
    });
    setNewOwner({ name: '', email: '', password: '', mobile: '' });
    setShowModal(true);
  };

  const handleEditTenant = (tenant: Business) => {
    setEditingTenant(tenant);
    setNewBusiness({ ...tenant });
    
    const owner = allUsers.find(u => 
      (String(u.tenantId || '01') === String(tenant.id) || (u.tenantIds && u.tenantIds.includes(String(tenant.id)))) 
      && u.role === Role.OWNER
    );
    if (owner) {
      setNewOwner({
        name: owner.name,
        email: owner.email,
        password: owner.password || '',
        mobile: owner.mobile || ''
      });
    } else {
      setNewOwner({ name: '', email: '', password: '', mobile: '' });
    }
    
    setShowModal(true);
  };

  const handleDeleteTenant = (tenantId: string) => {
    setTenantToDelete(tenantId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (tenantToDelete) {
      deleteTenant(tenantToDelete);
      setShowDeleteConfirm(false);
      setTenantToDelete(null);
      toast.success('Restaurant deleted successfully');
    }
  };

  const handleEditBill = (tenant: Business) => {
    setEditingBill(tenant.id);
    setBillAmount(tenant.monthlyBill);
  };

  const saveBill = (tenantId: string) => {
    updateTenant(tenantId, { monthlyBill: billAmount });
    setEditingBill(null);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTenant(null);
    setDuplicateSourceId(null);
    setNewBusiness({ id: '', name: '', address: '', phone: '', currency: '৳', themeColor: '#0f172a', monthlyBill: 500, logo: '', vatRate: 0, includeVat: false, timezone: 'UTC', customerTokenPrefix: 'ORD', customerAppEnabled: true, isMaintenanceMode: false, maintenanceMessage: '', maintenanceTime: '' });
    setNewOwner({ name: '', email: '', password: '', mobile: '' });
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredTenants.map(t => t.id));
    }
  };

  const toggleSelectTenant = (id: string) => {
    setSelectedTenants(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleBulkMaintenance = async (enable: boolean) => {
    if (selectedTenants.length === 0) return;
    
    setIsBulkUpdating(true);
    try {
      const promises = selectedTenants.map(id => 
        updateTenant(id, { 
          isMaintenanceMode: enable,
          maintenanceMessage: enable ? bulkMaintenanceMsg : '',
          maintenanceTime: enable ? '' : ''
        })
      );
      await Promise.all(promises);
      toast.success(`Maintenance mode ${enable ? 'enabled' : 'disabled'} for ${selectedTenants.length} restaurants`);
      setSelectedTenants([]);
      setBulkMaintenanceMsg('');
    } catch (err) {
      toast.error('Failed to update maintenance mode');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portal Administration</h1>
          <p className="text-slate-500">Manage all restaurant businesses and billing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Add New Restaurant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Restaurants</p>
          <h3 className="text-3xl font-bold text-slate-900">{tenants.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Active</p>
          <h3 className="text-3xl font-bold text-emerald-600">{tenants.filter(t => t.isActive).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Monthly Revenue (Approved)</p>
          <h3 className="text-3xl font-bold text-indigo-600">
            {currentTenant?.currency || '৳'}{monthlyBills
              .filter(b => {
                const now = new Date();
                const currentMonth = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
                return b.status === BillStatus.APPROVED && b.month === currentMonth;
              })
              .reduce((sum, b) => sum + b.amount, 0)}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue (All Time)</p>
          <h3 className="text-3xl font-bold text-emerald-600">
            {currentTenant?.currency || '৳'}{monthlyBills
              .filter(b => b.status === BillStatus.APPROVED)
              .reduce((sum, b) => sum + b.amount, 0)}
          </h3>
        </div>
      </div>

      <div className="w-full">
        {selectedTenants.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Bulk Actions ({selectedTenants.length} Selected)</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Apply changes to multiple restaurants at once</p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Write maintenance message here..."
                className="flex-1 bg-white border-2 border-amber-100 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-amber-400 transition-all"
                value={bulkMaintenanceMsg}
                onChange={(e) => setBulkMaintenanceMsg(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <button 
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkMaintenance(true)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-700 transition shadow-md disabled:opacity-50"
                >
                  Enable Maintenance
                </button>
                <button 
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkMaintenance(false)}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-300 transition disabled:opacity-50"
                >
                  Disable
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl border-2 border-black shadow-xl overflow-hidden">
            <div className="p-3 border-b-2 border-black bg-slate-50/50 flex items-center gap-3 group">
              <Search size={20} className="text-slate-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search restaurants by name or address..."
                className="bg-transparent border-none focus:ring-0 flex-1 text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={toggleSelectAll}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-black transition"
                >
                  {selectedTenants.length === filteredTenants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-[9px] uppercase tracking-wider border-b-2 border-black">
                    <th className="px-2 py-2 font-black w-8 border-r border-black">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 rounded border-2 border-black text-black focus:ring-black cursor-pointer"
                        checked={selectedTenants.length === filteredTenants.length && filteredTenants.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-2 py-2 font-black border-r border-black min-w-[120px]">Restaurant</th>
                    <th className="px-2 py-2 font-black border-r border-black w-24">Link</th>
                    <th className="px-2 py-2 font-black border-r border-black w-28">Contact</th>
                    <th className="px-2 py-2 font-black border-r border-black w-16">Status</th>
                    <th className="px-2 py-2 font-black border-r border-black w-16">Maint.</th>
                    <th className="px-2 py-2 font-black border-r border-black">Message</th>
                    <th className="px-2 py-2 font-black border-r border-black w-16">Time</th>
                    <th className="px-2 py-2 font-black border-r border-black w-16">Bill</th>
                    <th className="px-2 py-2 font-black text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`hover:bg-slate-50/50 transition ${!tenant.isActive ? 'opacity-60' : ''} ${selectedTenants.includes(tenant.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-2 py-2 border-r border-black">
                        <input 
                          type="checkbox" 
                          className="w-3 h-3 rounded border-2 border-black text-black focus:ring-black cursor-pointer"
                          checked={selectedTenants.includes(tenant.id)}
                          onChange={() => toggleSelectTenant(tenant.id)}
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg border-2 border-black bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            {tenant.logo ? (
                              <img src={tenant.logo} className="w-full h-full object-cover" alt="Logo" />
                            ) : (
                              <Building2 size={14} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-[10px] truncate leading-tight">{tenant.name}</p>
                            <p className="text-[7px] font-bold text-black uppercase tracking-widest bg-slate-100 px-1 py-0.5 rounded inline-block border border-black leading-none">
                              {tenant.id.slice(0, 6)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => copyLink(tenant.slug || tenant.id)}
                            className="p-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded border border-black flex items-center gap-1 group shrink-0"
                            title="Copy Link"
                          >
                            {copiedId === (tenant.slug || tenant.id) ? (
                              <Check size={10} className="text-emerald-600" />
                            ) : (
                              <Copy size={10} />
                            )}
                            <span className="text-[7px] font-black uppercase tracking-widest">Copy</span>
                          </button>
                          <a 
                            href={`https://restokeep.vercel.app/${tenant.slug || tenant.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded border border-black shrink-0"
                            title="Open Link"
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <div className="flex flex-col leading-tight">
                          <div className="flex items-center gap-1 text-slate-900">
                            <Phone size={8} />
                            <span className="text-[9px] font-bold whitespace-nowrap">{tenant.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin size={8} />
                            <span className="text-[8px] truncate max-w-[80px]">{tenant.address || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-black ${
                          tenant.isActive 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tenant.isActive ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <button 
                          onClick={() => updateTenant(tenant.id, { isMaintenanceMode: !tenant.isMaintenanceMode })}
                          className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-all border border-black ${
                            tenant.isMaintenanceMode 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-white text-slate-400'
                          }`}
                        >
                          {tenant.isMaintenanceMode ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <div className="min-w-[80px]">
                          <input 
                            type="text" 
                            placeholder="Msg..."
                            className="w-full bg-transparent border-b border-black hover:bg-white px-1 py-0.5 text-[8px] font-bold transition-all outline-none"
                            value={tenant.maintenanceMessage || ''}
                            onChange={(e) => updateTenant(tenant.id, { maintenanceMessage: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        <div className="min-w-[60px]">
                          <input 
                            type="text" 
                            placeholder="Time..."
                            className="w-full bg-transparent border-b border-black hover:bg-white px-1 py-0.5 text-[8px] font-bold transition-all outline-none"
                            value={tenant.maintenanceTime || ''}
                            onChange={(e) => updateTenant(tenant.id, { maintenanceTime: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-black">
                        {editingBill === tenant.id ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              className="w-10 px-1 py-0.5 border border-black rounded text-[8px] font-bold outline-none"
                              value={billAmount}
                              onChange={(e) => setBillAmount(Number(e.target.value))}
                            />
                            <button onClick={() => saveBill(tenant.id)} className="text-emerald-600">
                              <Save size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <span className="font-bold text-slate-900 text-[9px]">{currentTenant?.currency || '৳'}{tenant.monthlyBill}</span>
                            <button 
                              onClick={() => handleEditBill(tenant)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-black"
                            >
                              <Edit3 size={8} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedTenantForPrinter(tenant); setShowPrinterModal(true); }} className="p-0.5 text-slate-400 hover:text-indigo-600" title="Printer Setup"><Printer size={12} /></button>
                          <button onClick={() => handleEditTenant(tenant)} className="p-0.5 text-slate-400 hover:text-black" title="Edit"><Edit3 size={12} /></button>
                          <button onClick={() => handleDuplicateTenant(tenant)} className="p-0.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors" title="Duplicate Menu"><Copy size={12} /></button>
                          <button onClick={() => toggleBusinessStatus(tenant.id)} className={tenant.isActive ? 'text-red-500' : 'text-emerald-500'} title={tenant.isActive ? 'Deactivate' : 'Activate'}><Power size={12} /></button>
                          <button onClick={() => handleDeleteTenant(tenant.id)} className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={12} /></button>
                          <button onClick={() => navigate(`/${tenant.slug || tenant.id}/dashboard`)} className="p-0.5 text-slate-400 hover:text-black" title="Dashboard"><ExternalLink size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y-2 divide-black">
              {filteredTenants.map((tenant) => (
                <div 
                  key={tenant.id} 
                  className={`p-4 space-y-4 transition-all border-2 m-2 rounded-2xl ${
                    selectedTenants.includes(tenant.id) 
                      ? 'bg-indigo-50/50 border-black shadow-lg' 
                      : 'bg-white border-black hover:bg-slate-50'
                  } ${!tenant.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-2 border-black text-black focus:ring-black cursor-pointer"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={() => toggleSelectTenant(tenant.id)}
                      />
                      <div className="w-12 h-12 rounded-2xl border-2 border-black bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                        {tenant.logo ? (
                          <img src={tenant.logo} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                          <Building2 size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{tenant.name}</p>
                        <p className="text-[9px] font-black text-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded inline-block mt-1 border border-black">
                          ID: {tenant.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        tenant.isActive 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-600' 
                          : 'bg-red-100 text-red-700 border border-red-600'
                      }`}>
                        {tenant.isActive ? 'Active' : 'Offline'}
                      </span>
                      <p className="text-xs font-black text-slate-900">{currentTenant?.currency || '৳'}{tenant.monthlyBill}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => copyLink(tenant.slug || tenant.id)}
                      className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-xl border-2 border-black text-black active:scale-95 transition-all"
                    >
                      {copiedId === (tenant.slug || tenant.id) ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">Copy Link</span>
                    </button>
                    <a 
                      href={`https://restokeep.vercel.app/${tenant.slug || tenant.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-xl border-2 border-black text-black active:scale-95 transition-all"
                    >
                      <ExternalLink size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Open</span>
                    </a>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50/50 rounded-xl border-2 border-black">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-black uppercase tracking-widest">Maintenance Mode</p>
                      <button 
                        onClick={() => updateTenant(tenant.id, { isMaintenanceMode: !tenant.isMaintenanceMode })}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          tenant.isMaintenanceMode 
                            ? 'bg-amber-100 text-amber-700 border-2 border-black' 
                            : 'bg-white text-black border-2 border-black'
                        }`}
                      >
                        {tenant.isMaintenanceMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <input 
                        type="text" 
                        placeholder="Maintenance message..."
                        className="w-full bg-white border-2 border-black rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                        value={tenant.maintenanceMessage || ''}
                        onChange={(e) => updateTenant(tenant.id, { maintenanceMessage: e.target.value })}
                      />
                      <input 
                        type="text" 
                        placeholder="Estimated time (e.g. 2:00 PM)"
                        className="w-full bg-white border-2 border-black rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                        value={tenant.maintenanceTime || ''}
                        onChange={(e) => updateTenant(tenant.id, { maintenanceTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedTenantForPrinter(tenant); setShowPrinterModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Printer Setup"><Printer size={18} /></button>
                      <button onClick={() => handleEditTenant(tenant)} className="p-2 text-slate-700 hover:text-black" title="Edit"><Edit3 size={18} /></button>
                      <button onClick={() => toggleBusinessStatus(tenant.id)} className={tenant.isActive ? 'text-red-600' : 'text-emerald-600'} title={tenant.isActive ? 'Deactivate' : 'Activate'}><Power size={18} /></button>
                      <button onClick={() => handleDeleteTenant(tenant.id)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={18} /></button>
                    </div>
                    <button 
                      onClick={() => navigate(`/${tenant.slug || tenant.id}/dashboard`)}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-black"
                    >
                      Dashboard <ChevronDown size={14} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-0 md:border-2 border-indigo-500 shadow-indigo-100 min-h-screen md:min-h-0 md:max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                {editingTenant ? `Edit ${editingTenant.name}` : duplicateSourceId ? 'Duplicate Restaurant' : 'Register New Restaurant'}
              </h2>
              <button 
                onClick={resetForm} 
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreate} className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Building2 size={16} /> Business Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Slug (URL Name)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. my-restaurant"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none pl-12 transition-all font-bold text-sm"
                          value={newBusiness.slug || newBusiness.id || ''}
                          onChange={(e) => setNewBusiness({...newBusiness, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs"># /</div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Leave empty for auto-generated slug</p>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Restaurant Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.name || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Logo URL</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.logo || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, logo: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Address</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.address || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Phone</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.phone || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Currency</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                        value={newBusiness.currency || '৳'}
                        onChange={(e) => setNewBusiness({...newBusiness, currency: e.target.value})}
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">VAT Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.vatRate || 0}
                        onChange={(e) => setNewBusiness({...newBusiness, vatRate: Number(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input 
                        type="checkbox" 
                        id="includeVat"
                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        checked={newBusiness.includeVat || false}
                        onChange={(e) => setNewBusiness({...newBusiness, includeVat: e.target.checked})}
                      />
                      <label htmlFor="includeVat" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">Include VAT in Price</label>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Timezone</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                        value={newBusiness.timezone || 'UTC'}
                        onChange={(e) => setNewBusiness({...newBusiness, timezone: e.target.value})}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dhaka">Asia/Dhaka</option>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Theme Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          className="w-12 h-11 p-1 rounded-xl border-2 border-slate-100 cursor-pointer"
                          value={newBusiness.themeColor || '#0f172a'}
                          onChange={(e) => setNewBusiness({...newBusiness, themeColor: e.target.value})}
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm uppercase"
                          value={newBusiness.themeColor || '#0f172a'}
                          onChange={(e) => setNewBusiness({...newBusiness, themeColor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Token Prefix</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm uppercase"
                        value={newBusiness.customerTokenPrefix || 'ORD'}
                        onChange={(e) => setNewBusiness({...newBusiness, customerTokenPrefix: e.target.value.toUpperCase()})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Monthly Bill</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.monthlyBill || 500}
                        onChange={(e) => setNewBusiness({...newBusiness, monthlyBill: Number(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" 
                        id="customerAppEnabled"
                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        checked={newBusiness.customerAppEnabled ?? true}
                        onChange={(e) => setNewBusiness({...newBusiness, customerAppEnabled: e.target.checked})}
                      />
                      <label htmlFor="customerAppEnabled" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">Customer App Enabled</label>
                    </div>

                    <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="isMaintenanceMode"
                          className="w-5 h-5 rounded border-2 border-amber-200 text-amber-600 focus:ring-amber-500"
                          checked={newBusiness.isMaintenanceMode || false}
                          onChange={(e) => setNewBusiness({...newBusiness, isMaintenanceMode: e.target.checked})}
                        />
                        <label htmlFor="isMaintenanceMode" className="text-xs font-black uppercase text-amber-600 tracking-wider cursor-pointer flex items-center gap-2">
                          <AlertTriangle size={14} /> Enable Maintenance Mode
                        </label>
                      </div>
                      
                      {newBusiness.isMaintenanceMode && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Maintenance Message</label>
                            <textarea 
                              className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-500 outline-none transition-all font-bold text-sm h-24 resize-none bg-amber-50/30"
                              placeholder="e.g. We are currently updating our system. We will be back shortly!"
                              value={newBusiness.maintenanceMessage || ''}
                              onChange={(e) => setNewBusiness({...newBusiness, maintenanceMessage: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Estimated Time</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-500 outline-none transition-all font-bold text-sm bg-amber-50/30"
                              placeholder="e.g. 2:00 PM"
                              value={newBusiness.maintenanceTime || ''}
                              onChange={(e) => setNewBusiness({...newBusiness, maintenanceTime: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User size={16} /> {editingTenant ? 'Owner Account' : 'Initial Owner Account'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Owner Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.name || ''}
                        onChange={(e) => setNewOwner({...newOwner, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Email Address</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.email || ''}
                        onChange={(e) => setNewOwner({...newOwner, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Mobile</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.mobile || ''}
                        onChange={(e) => setNewOwner({...newOwner, mobile: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Password</label>
                      <input 
                        required
                        minLength={6}
                        type="password" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.password || ''}
                        onChange={(e) => setNewOwner({...newOwner, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 mt-8">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Note</h4>
                    <p className="text-[10px] font-bold text-indigo-900 leading-relaxed">
                      {editingTenant 
                        ? "Editing owner details here will update the primary owner account for this restaurant. Be careful with email/password changes."
                        : "This account will be created as the primary owner for the new restaurant with full administrative permissions."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pb-2">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-100 transition-all border-2 border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 border-2 border-indigo-600"
                >
                  {editingTenant ? 'Save Business Changes' : duplicateSourceId ? 'Duplicate Business' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] border-[3px] border-black shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-[3px] border-red-500">
                  <Trash2 size={40} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Confirm Delete?</h3>
                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                  Are you sure you want to delete this restaurant? This action is <span className="text-red-600 underline">permanent</span> and all data will be lost forever.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmDelete}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 active:scale-[0.98] transition-all border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Yes, Delete Forever
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all border-[3px] border-black"
                  >
                    No, Keep It
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal Code ... */}

      {/* Printer Setup Modal */}
      <AnimatePresence>
        {showPrinterModal && selectedTenantForPrinter && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] border-[3px] border-black shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b-[3px] border-black bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center border-2 border-black">
                    <Printer className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Printer Setup</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTenantForPrinter.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowPrinterModal(false); setSelectedTenantForPrinter(null); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-400 hover:text-black transition-colors border-2 border-transparent hover:border-black"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Toggles */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Settings</h4>
                    
                    {[
                      { key: 'enablePrintAgent', label: 'Enable Print Agent', desc: 'Print through PC connection' },
                      { key: 'enablePrinterRelay', label: 'Mobile Printer Relay', desc: 'Allow phone as printing hub' },
                      { key: 'autoMarkReadyOnPrint', label: 'Auto Mark Done', desc: 'Ready on KOT print' },
                      { key: 'showLogo', label: 'Show Logo on Receipt', desc: 'Include logo header' },
                      { key: 'autoPrintKOT', label: 'Auto-print KOT', desc: 'Print on new order' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-4 bg-slate-50 border-2 border-black rounded-2xl cursor-pointer hover:bg-white transition-all">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{item.label}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{item.desc}</span>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={!!selectedTenantForPrinter.printerSettings?.[item.key as keyof typeof selectedTenantForPrinter.printerSettings]}
                            onChange={(e) => {
                              const newSettings = { 
                                ...selectedTenantForPrinter.printerSettings, 
                                [item.key]: e.target.checked 
                              };
                              setSelectedTenantForPrinter({
                                ...selectedTenantForPrinter,
                                printerSettings: newSettings as any
                              });
                            }}
                          />
                          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Text Areas */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Receipt Content</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Header Custom Text</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border-2 border-black rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-xs transition-all h-32 resize-none"
                        placeholder="Welcome message..."
                        value={selectedTenantForPrinter.printerSettings?.receiptHeader || ''}
                        onChange={(e) => {
                          const newSettings = { ...selectedTenantForPrinter.printerSettings, receiptHeader: e.target.value };
                          setSelectedTenantForPrinter({ ...selectedTenantForPrinter, printerSettings: newSettings as any });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Footer Custom Text</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border-2 border-black rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-xs transition-all h-32 resize-none"
                        placeholder="Thank you message..."
                        value={selectedTenantForPrinter.printerSettings?.receiptFooter || ''}
                        onChange={(e) => {
                          const newSettings = { ...selectedTenantForPrinter.printerSettings, receiptFooter: e.target.value };
                          setSelectedTenantForPrinter({ ...selectedTenantForPrinter, printerSettings: newSettings as any });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t-[3px] border-black bg-slate-50 flex gap-3">
                <button 
                  onClick={() => { setShowPrinterModal(false); setSelectedTenantForPrinter(null); }}
                  className="flex-1 py-4 bg-white border-2 border-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 active:scale-[0.98] transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={async () => {
                    await updateTenant(selectedTenantForPrinter.id, { printerSettings: selectedTenantForPrinter.printerSettings });
                    toast.success('Printer settings updated successfully');
                    setShowPrinterModal(false);
                    setSelectedTenantForPrinter(null);
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white border-2 border-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
