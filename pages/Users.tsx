
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { UserPlus, Users as UsersIcon, Shield, Trash2, Mail, Phone, Lock, CheckSquare, Square, Edit2, X, ChevronRight, Search, AlertTriangle } from 'lucide-react';

const AVAILABLE_MODULES = ['Dashboard', 'POS', 'Kitchen', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings'];

export const Users = () => {
    const { users, allUsers, currentTenant, addUser, updateUser, deleteUser } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: Role.WAITER,
        permissions: [] as string[]
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', mobile: '', role: Role.WAITER, permissions: ['POS'] });
        setEditingUserId(null);
        setError(null);
    };

    const handleEditClick = (user: User) => {
        setError(null);
        setFormData({
            name: user.name,
            email: user.email,
            password: user.password || '',
            mobile: user.mobile,
            role: user.role,
            permissions: user.permissions || []
        });
        setEditingUserId(user.id);
        setIsFormOpen(true);
    };

    const togglePermission = (moduleName: string) => {
        setFormData(prev => {
            if (prev.permissions.includes(moduleName)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== moduleName) };
            } else {
                return { ...prev, permissions: [...prev.permissions, moduleName] };
            }
        });
    };

    const handleRoleChange = (role: Role) => {
        let perms: string[] = [];
        switch(role) {
            case Role.OWNER: perms = AVAILABLE_MODULES; break;
            case Role.MANAGER: perms = ['Dashboard', 'POS', 'Kitchen', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users']; break;
            case Role.WAITER: perms = ['POS']; break;
            case Role.KITCHEN: perms = ['Kitchen']; break;
            case Role.CASHIER: perms = ['Billing', 'Transactions', 'Reports']; break;
            case Role.INVENTORY_MANAGER: perms = ['Inventory']; break;
            default: perms = [];
        }
        setFormData(prev => ({ ...prev, role, permissions: perms }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant) return;
        setError(null);

        // Check for duplicate email globally
        const isDuplicate = allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUserId);
        if (isDuplicate) {
            setError('This email is already registered in the system.');
            return;
        }

        if (editingUserId) {
            updateUser(editingUserId, {
                ...formData,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            });
        } else {
            const newUser: User = {
                id: `u-${Date.now()}`,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                mobile: formData.mobile,
                role: formData.role,
                permissions: formData.permissions,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            };
            addUser(newUser);
        }

        resetForm();
        setIsFormOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            deleteUser(id);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        <UsersIcon className="text-indigo-600" size={36} /> Team Roster
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Access control & Staffing</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-500 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-black text-[10px] uppercase transition-all shadow-lg shadow-indigo-100"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            resetForm();
                            setIsFormOpen(true);
                            handleRoleChange(Role.WAITER);
                        }}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition border-2 border-indigo-400 flex items-center justify-center gap-3 shadow-indigo-200"
                    >
                        <UserPlus size={20} strokeWidth={3} /> Add <span className="hidden sm:inline">Member</span>
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border-2 border-indigo-500 animate-in fade-in slide-in-from-top-4 overflow-hidden shadow-indigo-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingUserId ? 'Modify Profile' : 'New Enrollment'}</h3>
                        <button onClick={() => setIsFormOpen(false)} className="bg-slate-50 p-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={20} />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                                <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold uppercase text-xs focus:bg-white shadow-inner" placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Access</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="staff@dine.com" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                 <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="tel" required value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="+1..." />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Passkey</label>
                                 <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="password" required value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position / Role</label>
                                <div className="relative">
                                    <select value={formData.role} onChange={e => handleRoleChange(e.target.value as Role)} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black uppercase text-[10px] appearance-none focus:bg-white shadow-inner">
                                        {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-900 pointer-events-none" size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Permissions Override</label>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {AVAILABLE_MODULES.map(module => (
                                    <button
                                        type="button"
                                        key={module}
                                        onClick={() => togglePermission(module)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                                            ${formData.permissions.includes(module) 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900'}`}
                                    >
                                        {formData.permissions.includes(module) ? <CheckSquare size={14} /> : <Square size={14} />}
                                        {module}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-dashed border-slate-100">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition">Cancel</button>
                            <button type="submit" className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] border-4 border-white shadow-xl hover:bg-black transition">
                                {editingUserId ? 'Update Profile' : 'Confirm Enrollment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-indigo-500 overflow-hidden shadow-indigo-100">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b-2 border-indigo-100">
                            <tr>
                                <th className="p-6">Staff Details</th>
                                <th className="p-6">Position</th>
                                <th className="p-6">Module Access</th>
                                <th className="p-6">Contact info</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-slate-900 shadow-sm" />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 uppercase tracking-tighter text-sm">{user.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2
                                            ${user.role === Role.OWNER ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 
                                              user.role === Role.MANAGER ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                                              'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Shield size={10} /> {user.role}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                                            {(user.permissions || []).map(p => (
                                                <span key={p} className="text-[8px] px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-400 font-black uppercase tracking-tighter">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[10px] font-black text-slate-900 tracking-widest">{user.mobile}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        {user.role !== Role.OWNER && user.role !== Role.SUPER_ADMIN && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(user)} className="p-3 text-slate-300 hover:text-indigo-600 bg-white border-2 border-transparent hover:border-indigo-100 rounded-xl transition shadow-sm"><Edit2 size={18} strokeWidth={3}/></button>
                                                <button onClick={(e) => handleDelete(user.id, e)} className="p-3 text-slate-300 hover:text-red-600 bg-white border-2 border-transparent hover:border-red-100 rounded-xl transition shadow-sm"><Trash2 size={18} strokeWidth={3}/></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
