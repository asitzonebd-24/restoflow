
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Store, Globe, Percent } from 'lucide-react';

export const Settings = () => {
    const { business, updateBusiness } = useApp();
    
    // Local state for form
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('');
    const [logo, setLogo] = useState('');
    const [themeColor, setThemeColor] = useState('#000000');
    const [vatRate, setVatRate] = useState(0);
    const [includeVat, setIncludeVat] = useState(false);
    const [customerAppEnabled, setCustomerAppEnabled] = useState(true);
    const [customerTokenPrefix, setCustomerTokenPrefix] = useState('ORD');
    const [nextCustomerToken, setNextCustomerToken] = useState(1);

    // Load tenant data into form on mount
    useEffect(() => {
        if (business) {
            setName(business.name);
            setAddress(business.address);
            setPhone(business.phone || '');
            setCurrency(business.currency);
            setLogo(business.logo);
            setThemeColor(business.themeColor);
            setVatRate(business.vatRate);
            setIncludeVat(business.includeVat);
            setCustomerAppEnabled(business.customerAppEnabled ?? true);
            setCustomerTokenPrefix(business.customerTokenPrefix || 'ORD');
            setNextCustomerToken(business.nextCustomerToken || 1);
        }
    }, [business]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (business) {
            updateBusiness({
                name,
                address,
                phone,
                currency,
                logo,
                themeColor,
                vatRate,
                includeVat,
                customerAppEnabled,
                customerTokenPrefix,
                nextCustomerToken
            });
            alert('Settings saved successfully!');
        }
    };

    if (!business) return null;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 bg-[#f8fafc] min-h-full">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-4 bg-white rounded-[1.5rem] shadow-sm border-2 border-slate-900">
                    <SettingsIcon className="text-slate-900" size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Business Config</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">System Preferences & Profile</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-12">
                {/* Profile Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-900">
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Store size={24} className="text-indigo-600"/> Restaurant Profile
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-bold text-sm uppercase transition-all shadow-inner"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Phone</label>
                             <input 
                                type="text" 
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-bold text-sm uppercase transition-all shadow-inner"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Brand Theme Color</label>
                             <div className="flex gap-3">
                                <input 
                                    type="color" 
                                    value={themeColor}
                                    onChange={e => setThemeColor(e.target.value)}
                                    className="h-14 w-14 border-4 border-slate-900 rounded-2xl cursor-pointer"
                                />
                                <input 
                                    type="text" 
                                    value={themeColor}
                                    onChange={e => setThemeColor(e.target.value)}
                                    className="flex-1 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black text-sm uppercase transition-all shadow-inner"
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Physical Address</label>
                             <textarea 
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                rows={2}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-bold text-sm uppercase transition-all shadow-inner resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Regional & Tax Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-900">
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Percent size={24} className="text-emerald-600"/> Tax & Regional Settings
                    </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Currency Symbol</label>
                             <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black text-sm uppercase transition-all shadow-inner appearance-none"
                             >
                                 <option value="$">USD ($)</option>
                                 <option value="£">GBP (£)</option>
                                 <option value="€">EUR (€)</option>
                                 <option value="₹">INR (₹)</option>
                                 <option value="৳">BDT (৳)</option>
                                 <option value="د.إ">AED (د.إ)</option>
                                 <option value="﷼">SAR (﷼)</option>
                             </select>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Billing Tax (VAT)</label>
                            <div className="flex items-center gap-6 p-2 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-inner">
                                <div className="flex-1 flex items-center gap-3 ml-2">
                                    <div className={`w-3 h-3 rounded-full ${includeVat ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
                                        {includeVat ? 'VAT ENABLED' : 'VAT DISABLED'}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mr-2">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={includeVat}
                                        onChange={e => setIncludeVat(e.target.checked)}
                                    />
                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>
                            
                            {includeVat && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">VAT Rate (%)</label>
                                    <input 
                                        type="number" 
                                        value={vatRate}
                                        min="0"
                                        step="0.1"
                                        onChange={e => setVatRate(Number(e.target.value))}
                                        className="w-full p-3 bg-white border-2 border-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none font-black text-sm transition-all"
                                    />
                                </div>
                            )}
                        </div>
                     </div>
                </div>

                {/* Customer App Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-900">
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Globe size={24} className="text-blue-600"/> Customer App & Token Settings
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Order Token Prefix</label>
                            <input 
                                type="text" 
                                value={customerTokenPrefix}
                                onChange={e => setCustomerTokenPrefix(e.target.value.toUpperCase())}
                                placeholder="e.g. WEB"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black text-sm uppercase transition-all shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Next Token Number</label>
                            <input 
                                type="number" 
                                value={nextCustomerToken}
                                onChange={e => setNextCustomerToken(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black text-sm uppercase transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-inner flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Enable Customer Ordering Portal</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                When enabled, customers can access the ordering app from the login screen.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
                                {customerAppEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={customerAppEnabled}
                                    onChange={e => setCustomerAppEnabled(e.target.checked)}
                                />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        className="flex items-center gap-4 bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition transform active:scale-95 border-4 border-white"
                    >
                        <Save size={24} strokeWidth={3} /> Save Business Profile
                    </button>
                </div>
            </form>
        </div>
    );
};
