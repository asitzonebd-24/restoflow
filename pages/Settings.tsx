
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Store, Globe, Percent, Upload, Image as ImageIcon, User as UserIcon, Lock, Mail, Phone, Printer, QrCode, Check, X } from 'lucide-react';
import { Role, InventoryMode } from '../types';
import { BluetoothPrinterService } from '../services/printerService';
import { QRCodeModal } from '../components/QRCodeModal';

export const Settings = () => {
    const { business, updateBusiness, currentUser, updateUser } = useApp();
    
    // Business Settings state
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
    const [inventoryMode, setInventoryMode] = useState<InventoryMode>(InventoryMode.SIMPLE);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isBluetoothWizardOpen, setIsBluetoothWizardOpen] = useState(false);
    const [wizardContext, setWizardContext] = useState<'business' | 'personal'>('business');

    // Printer Settings state
    const [receiptHeader, setReceiptHeader] = useState('');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [autoPrintKOT, setAutoPrintKOT] = useState(false);
    const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);
    const [enablePrintAgent, setEnablePrintAgent] = useState(false);
    const [showLogo, setShowLogo] = useState(true);
    const [pairedPrinterName, setPairedPrinterName] = useState('');
    const [pairedPrinterId, setPairedPrinterId] = useState('');
    const [autoMarkReadyOnPrint, setAutoMarkReadyOnPrint] = useState(false);
    const [isBluetoothSearching, setIsBluetoothSearching] = useState(false);

    // User Profile state
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userAvatar, setUserAvatar] = useState('');

    // User Printer settings
    const [userPrinterName, setUserPrinterName] = useState('');
    const [userPrinterId, setUserPrinterId] = useState('');
    const [userPaperWidth, setUserPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [isUserPrinterSearching, setIsUserPrinterSearching] = useState(false);

    const hasSettingsPermission = currentUser?.permissions?.includes('Settings') || currentUser?.role === Role.SUPER_ADMIN;

    // Load data into form on mount
    useEffect(() => {
        if (business) {
            setName(business.name);
            setAddress(business.address);
            setPhone(business.phone || '');
            setCurrency(business.currency || '৳');
            setLogo(business.logo);
            setThemeColor(business.themeColor);
            setVatRate(business.vatRate);
            setIncludeVat(business.includeVat);
            setCustomerAppEnabled(business.customerAppEnabled ?? true);
            setCustomerTokenPrefix(business.customerTokenPrefix || 'ORD');
            setNextCustomerToken(business.nextCustomerToken || 1);
            setInventoryMode(business.inventoryMode || InventoryMode.SIMPLE);
            
            if (business.printerSettings) {
                setReceiptHeader(business.printerSettings.receiptHeader || '');
                setReceiptFooter(business.printerSettings.receiptFooter || '');
                setPaperWidth(business.printerSettings.paperWidth || '80mm');
                setAutoPrintKOT(business.printerSettings.autoPrintKOT || false);
                setAutoPrintInvoice(business.printerSettings.autoPrintInvoice || false);
                setEnablePrintAgent(business.printerSettings.enablePrintAgent || false);
                setShowLogo(business.printerSettings.showLogo ?? true);
                setPairedPrinterName(business.printerSettings.pairedPrinterName || '');
                setPairedPrinterId(business.printerSettings.pairedPrinterId || '');
                setAutoMarkReadyOnPrint(business.printerSettings.autoMarkReadyOnPrint || false);
            }
        }
        if (currentUser) {
            setUserName(currentUser.name);
            setUserEmail(currentUser.email);
            setUserMobile(currentUser.mobile);
            setUserPassword(currentUser.password || '');
            setUserAvatar(currentUser.avatar || '');
            
            if (currentUser.printerSettings) {
                setUserPrinterName(currentUser.printerSettings.pairedPrinterName || '');
                setUserPrinterId(currentUser.printerSettings.pairedPrinterId || '');
                setUserPaperWidth(currentUser.printerSettings.paperWidth || '80mm');
            } else {
                setUserPrinterName('');
                setUserPrinterId('');
                setUserPaperWidth('80mm');
            }
        }
    }, [business, currentUser]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBusinessSubmit = (e: React.FormEvent) => {
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
                nextCustomerToken,
                inventoryMode,
                printerSettings: {
                    ...business.printerSettings,
                    receiptHeader,
                    receiptFooter,
                    paperWidth,
                    autoPrintKOT,
                    autoPrintInvoice,
                    enablePrintAgent,
                    autoMarkReadyOnPrint,
                    showLogo,
                    pairedPrinterName,
                    pairedPrinterId
                }
            });
            alert('Business settings saved successfully!');
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            try {
                await updateUser(currentUser.id, {
                    name: userName,
                    email: userEmail,
                    mobile: userMobile,
                    password: userPassword,
                    avatar: userAvatar,
                    printerSettings: {
                        ...currentUser.printerSettings,
                        pairedPrinterName: userPrinterName,
                        pairedPrinterId: userPrinterId,
                        paperWidth: userPaperWidth,
                        autoPrintInvoice: currentUser.printerSettings?.autoPrintInvoice ?? false,
                        autoPrintKOT: currentUser.printerSettings?.autoPrintKOT ?? false,
                        showLogo: currentUser.printerSettings?.showLogo ?? true,
                    }
                });
                alert('Profile and personal printer settings updated successfully!');
            } catch (err) {
                console.error('Profile update failed:', err);
                alert('Failed to update profile. Please check if you have permission.');
            }
        }
    };

    const handleUserPrinterPairing = async () => {
        setWizardContext('personal');
        setIsBluetoothWizardOpen(true);
    };

    const handleTestUserPrint = async () => {
        if (!userPrinterId) {
            alert('No personal printer paired yet.');
            return;
        }
        try {
            const result = await BluetoothPrinterService.connect(userPrinterId);
            if (!result.success) {
                alert('Could not connect to your printer. Please ensure it is on.');
                return;
            }
            
            const pixelWidth = userPaperWidth === '58mm' ? 384 : 576;
            await BluetoothPrinterService.printRaw(new Uint8Array([0x1B, 0x40])); // Init
            await BluetoothPrinterService.printTextLine('Personal Printer Test', pixelWidth, { align: 'center', doubleSize: true, bold: true });
            await BluetoothPrinterService.printTextLine(`Staff: ${userName}`, pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine(`ID: ${userPrinterId}`, pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printRaw(new Uint8Array([...Array(4).fill(0x0A), 0x1D, 0x56, 0x41, 0x03])); // Feed & Cut
            await BluetoothPrinterService.disconnect();
            
            alert('Test print sent to your personal printer!');
        } catch (error) {
            console.error('User test print error:', error);
            alert('Test print failed.');
        }
    };

    const handleAddBluetoothPrinter = async () => {
        setWizardContext('business');
        setIsBluetoothWizardOpen(true);
    };

    const handleTestPrint = async () => {
        try {
            const result = await BluetoothPrinterService.connect(pairedPrinterId);
            if (!result.success) {
                alert('Could not connect to the paired printer. Please try pairing again.');
                return;
            }
            
            const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
            
            await BluetoothPrinterService.printRaw(new Uint8Array([0x1B, 0x40])); // Init
            await BluetoothPrinterService.printTextLine('RestoKeep Test Print', pixelWidth, { align: 'center', doubleSize: true, bold: true });
            await BluetoothPrinterService.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('বাংলা ফন্ট টেস্ট (Bangla Test)', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Printer: ' + pairedPrinterName, pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Status: Working Correctly', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Date: ' + new Date().toLocaleString(), pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printRaw(new Uint8Array([...Array(4).fill(0x0A), 0x1D, 0x56, 0x41, 0x03])); // Feed & Cut
            await BluetoothPrinterService.disconnect();
            
            alert('Test print sent!');
        } catch (error) {
            console.error('Test print error:', error);
            alert('Test print failed. Check console for details.');
        }
    };

    if (!business || !currentUser) return null;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-[#f8fafc] min-h-full font-sans">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your profile and business preferences</p>
                </div>
                <button 
                    onClick={() => setIsQRModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                    <QrCode size={18} />
                    Store QR Code
                </button>
            </div>

            <div className="space-y-8 pb-12">
                {/* User Profile Section */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl shadow-slate-100 hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center border border-slate-100">
                                <UserIcon size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Profile</h2>
                        </div>
                        <button 
                            onClick={handleProfileSubmit}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            Update Profile
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 mb-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center group-hover:border-slate-900/20 transition-all">
                                    {userAvatar ? (
                                        <img 
                                            src={userAvatar} 
                                            alt="User Avatar" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <UserIcon size={32} className="text-slate-200" />
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-600 transition-all active:scale-90">
                                    <Upload size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Profile Picture</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                                    Your avatar is visible in the sidebar and team list.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={userEmail}
                                    onChange={e => setUserEmail(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={userMobile}
                                    onChange={e => setUserMobile(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={userPassword}
                                    onChange={e => setUserPassword(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        {/* Personal Printer Settings */}
                        <div className="md:col-span-2 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                                <Printer size={16} />
                                My Personal Printer
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Paper Width</label>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setUserPaperWidth('58mm')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${userPaperWidth === '58mm' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            58mm
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setUserPaperWidth('80mm')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${userPaperWidth === '80mm' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            80mm
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                    {userPrinterName ? (
                                        <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{userPrinterName}</span>
                                            <div className="flex gap-3">
                                                <button onClick={handleTestUserPrint} className="text-[8px] font-black uppercase text-emerald-700 underline">Test</button>
                                                <button onClick={() => {setUserPrinterName(''); setUserPrinterId('');}} className="text-[8px] font-black uppercase text-rose-500 underline">Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={handleUserPrinterPairing}
                                            disabled={isUserPrinterSearching}
                                            className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 disabled:opacity-50"
                                        >
                                            {isUserPrinterSearching ? 'Searching...' : 'Pair Personal Printer'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {hasSettingsPermission && (
                    <>
                        {/* Business Profile Section */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 hover:scale-[1.01] transition-all duration-300">
                            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                                        <Store size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Restaurant Profile</h2>
                                </div>
                                <button 
                                    onClick={handleBusinessSubmit}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Business
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 mb-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center group-hover:border-indigo-500/20 transition-all">
                                            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Store size={40} className="text-slate-200" />}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-600">
                                            <Upload size={16} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Business Logo</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Appear on receipts and app sidebar.</p>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Phone</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Theme Color</label>
                                    <div className="flex gap-3">
                                        <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="h-14 w-14 border-2 border-slate-100 rounded-2xl p-1.5 bg-white" />
                                        <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax & Regional Section */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-500 shadow-xl shadow-emerald-100 hover:scale-[1.01] transition-all duration-300">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                                    <Percent size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tax & Regional</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Currency Symbol</label>
                                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm">
                                        <option value="$">USD ($)</option>
                                        <option value="৳">BDT (৳)</option>
                                        <option value="₹">INR (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">VAT Rate (%)</label>
                                    <input type="number" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Printer & Receipt Section */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl shadow-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Printer Setup</h2>
                                <button onClick={handleBusinessSubmit} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest">Save Printer</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                                    {pairedPrinterName ? (
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{pairedPrinterName}</span>
                                            <div className="flex gap-4">
                                                <button onClick={handleTestPrint} className="text-emerald-600 underline text-xs font-bold uppercase tracking-widest">Test Print</button>
                                                <button onClick={() => {setPairedPrinterId(''); setPairedPrinterName('');}} className="text-rose-500 underline text-xs font-bold uppercase tracking-widest">Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={handleAddBluetoothPrinter} disabled={isBluetoothSearching} className="bg-white border-2 border-slate-900 text-slate-900 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                                            {isBluetoothSearching ? 'Searching...' : 'Add Bluetooth Printer'}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Print Options</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer" onClick={() => setEnablePrintAgent(!enablePrintAgent)}>
                                            <span className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">Enable Print Agent</span>
                                            <div className={`w-5 h-5 rounded border-2 ${enablePrintAgent ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'} flex items-center justify-center`}>
                                                <Check size={12} className="text-white" />
                                            </div>
                                        </label>
                                        <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer" onClick={() => setAutoMarkReadyOnPrint(!autoMarkReadyOnPrint)}>
                                            <span className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">Auto Mark Done on Print</span>
                                            <div className={`w-5 h-5 rounded border-2 ${autoMarkReadyOnPrint ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'} flex items-center justify-center`}>
                                                <Check size={12} className="text-white" />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paper Width</label>
                                    <div className="flex gap-3">
                                        {['58mm', '80mm'].map(w => (
                                            <button key={w} onClick={() => setPaperWidth(w as any)} className={`flex-1 p-4 rounded-2xl border-2 font-bold text-sm ${paperWidth === w ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>{w}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Receipt Header</label>
                                    <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm italic text-slate-500">{receiptHeader || 'No header set'}</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <QRCodeModal 
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                url={`https://restokeep.vercel.app/${business?.id}/order/auth`}
                businessName={business?.name || 'Restaurant'}
                logo={business?.logo}
                address={business?.address}
                phone={business?.phone}
            />

            {/* Bluetooth Setup Wizard Modal */}
            {isBluetoothWizardOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBluetoothWizardOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border-4 border-black overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 md:p-10 overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Bluetooth Setup Guide</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paired as: {wizardContext === 'business' ? 'Business Main Printer' : 'Your Personal Printer'}</p>
                                </div>
                                <button onClick={() => setIsBluetoothWizardOpen(false)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Ensure Printer is ON</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Turn on your Bluetooth thermal printer and make sure it has paper.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Chrome & Android Tips</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Android users **MUST** turn on both Bluetooth & Location (GPS). When the browser popup appears, select your printer.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Pairing & Connection</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Click the button below to start searching. Chrome will show its own small window for selection.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl">
                                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                                        <Lock size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Chrome Tip</span>
                                    </div>
                                    <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                                        To avoid pairing every time, make sure your computer's OS (Windows/Mac) has already paired with the printer. Chrome will then remember it for this website.
                                    </p>
                                </div>

                                <button 
                                    onClick={async () => {
                                        if (wizardContext === 'business') {
                                            setIsBluetoothSearching(true);
                                        } else {
                                            setIsUserPrinterSearching(true);
                                        }

                                        const result = await BluetoothPrinterService.connect();
                                        
                                        if (result.success && result.device) {
                                            const newName = result.device.name || 'Unknown Printer';
                                            const newId = result.device.id;
                                            
                                            if (wizardContext === 'business') {
                                                setPairedPrinterName(newName);
                                                setPairedPrinterId(newId);
                                                updateBusiness({
                                                    printerSettings: {
                                                        ...business.printerSettings,
                                                        pairedPrinterName: newName,
                                                        pairedPrinterId: newId
                                                    }
                                                });
                                            } else {
                                                setUserPrinterName(newName);
                                                setUserPrinterId(newId);
                                            }
                                            
                                            alert(`Printer "${newName}" Paired Successfully!`);
                                            setIsBluetoothWizardOpen(false);
                                        } else {
                                            alert('Failed to find printer. Please try again.');
                                        }

                                        setIsBluetoothSearching(false);
                                        setIsUserPrinterSearching(false);
                                    }}
                                    disabled={isBluetoothSearching || isUserPrinterSearching}
                                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isBluetoothSearching || isUserPrinterSearching ? 'Searching Devices...' : 'Search & Pair Printer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
