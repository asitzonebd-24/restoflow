import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BillStatus, MonthlyBill, SubscriptionPackage } from '../types';
import { CreditCard, CheckCircle, Clock, Wallet, FileText, Package, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

export const Subscription = () => {
  const { business, monthlyBills, currentUser, markBillAsPaid, subscriptionPackages, subscribeBusinessToPackage } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPackages, setShowPackages] = useState(false);

  const myBills = monthlyBills.filter(b => b.tenantId === business?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeSubscription = business?.subscription;

  useEffect(() => {
    const status = searchParams.get('status');
    const billId = searchParams.get('billId');
    const txnId = searchParams.get('txnId');

    if (status === 'success') {
      if (billId && txnId) {
        markBillAsPaid(billId, txnId);
        // Clear params to avoid multiple triggers
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('status');
        newParams.delete('billId');
        newParams.delete('txnId');
        setSearchParams(newParams);
      }

      toast.success(`Payment Successful!`, {
        description: `Transaction ID: ${txnId}`,
        duration: 5000
      });
    } else if (status === 'fail') {
      toast.error('Payment Failed. Please try again.');
    } else if (status === 'cancel') {
      toast.info('Payment Cancelled.');
    }
  }, [searchParams, markBillAsPaid, setSearchParams]);

  const handlePay = async (bill: MonthlyBill) => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/api/payment/init', {
        amount: bill.amount,
        tenantId: bill.tenantId,
        tenantName: bill.tenantName,
        billId: bill.id,
        customerEmail: currentUser?.email,
        customerMobile: currentUser?.mobile
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async (pkg: SubscriptionPackage) => {
    if (!business?.id) return;
    if (confirm(`Do you want to subscribe to the ${pkg.name}?`)) {
      await subscribeBusinessToPackage(business.id, pkg.id);
      setShowPackages(false);
    }
  };

  return (
    <div className="p-4 md:p-10 h-full overflow-y-auto no-scrollbar bg-slate-50">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8 md:mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
              <Wallet className="text-indigo-600" size={32} /> Subscription & Billing
            </h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] mt-2 opacity-80">Manage your software subscription and payments</p>
          </div>
          <button 
            onClick={() => setShowPackages(!showPackages)}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border-2 border-black flex items-center gap-2 ${showPackages ? 'bg-white text-black' : 'bg-indigo-600 text-white shadow-lg'}`}
          >
            {showPackages ? 'Close Plans' : 'Browse Plans'} <Package size={16} />
          </button>
        </div>

        {showPackages ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-6">
              <Package size={24} className="text-indigo-600" /> Available Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {subscriptionPackages.filter(p => p.isActive).map((pkg) => (
                <div key={pkg.id} className={`bg-white border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-all hover:-translate-y-1 ${activeSubscription?.packageId === pkg.id ? 'bg-indigo-50/10' : ''}`}>
                  {activeSubscription?.packageId === pkg.id && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest">
                      Active
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{pkg.name}</h4>
                    <p className="text-indigo-600 font-black text-3xl">
                      {business?.currency}{pkg.price}
                      <span className="text-xs text-slate-400 font-bold ml-1 uppercase">/ {pkg.durationMonths}m</span>
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-2">Includes access to:</p>
                    <ul className="space-y-2">
                        {pkg.allowedPages.slice(0, 5).map(pageId => (
                          <li key={pageId} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                            <CheckCircle size={10} className="text-emerald-500" /> {pageId}
                          </li>
                        ))}
                        {pkg.allowedPages.length > 5 && (
                          <li className="text-[9px] font-bold text-slate-400 uppercase italic">+ {pkg.allowedPages.length - 5} more modules</li>
                        )}
                    </ul>
                  </div>

                  <button 
                    disabled={activeSubscription?.packageId === pkg.id}
                    onClick={() => handleSubscribe(pkg)}
                    className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-black transition-all ${
                      activeSubscription?.packageId === pkg.id 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-black active:shadow-none'
                    }`}
                  >
                    {activeSubscription?.packageId === pkg.id ? 'Current Plan' : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Subscription Summary Card */
          <div className="bg-white border-2 border-black rounded-[2rem] p-8 md:p-10 mb-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-8 animate-in fade-in duration-300">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Your Active Plan</span>
              <h2 className="text-3xl md:text-4xl font-black text-indigo-600 mt-2 mb-2">
                {activeSubscription?.packageName || 'No Active Plan'}
              </h2>
              {activeSubscription && (
                <div className="space-y-1">
                  <p className="text-slate-500 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                    <Calendar size={14} /> Expire: <span className="text-slate-900 font-black">{new Date(activeSubscription.expiryDate).toLocaleDateString()}</span>
                  </p>
                  <p className="text-slate-500 text-sm font-medium">Monthly Bill: <span className="text-slate-900 font-black">{business?.currency}{business?.monthlyBill}/mo</span></p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className={`px-8 py-3 rounded-2xl flex items-center gap-3 shadow-lg border-2 ${activeSubscription?.status === 'active' ? 'bg-emerald-50 border-emerald-500 shadow-emerald-100' : 'bg-rose-50 border-rose-500 shadow-rose-100'}`}>
                {activeSubscription?.status === 'active' ? (
                  <CheckCircle className="text-emerald-500" size={20} />
                ) : (
                  <Clock className="text-rose-500" size={20} />
                )}
                <span className={`text-xs font-black uppercase tracking-[0.1em] ${activeSubscription?.status === 'active' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {activeSubscription?.status === 'active' ? 'Account Active' : 'Account Inactive'}
                </span>
              </div>
              {!activeSubscription && (
                <p className="text-[10px] font-bold text-indigo-600 animate-pulse">Subscribe to a plan to activate your account</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Clock size={24} className="text-slate-400" /> Billing History
          </h3>
          
          {myBills.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center shadow-inner">
              <CreditCard className="mx-auto text-slate-200 mb-6" size={64} strokeWidth={1.5} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No bills generated yet</p>
              <p className="text-slate-300 text-[10px] mt-2">Bills are automatically generated on the 1st of every month</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {myBills.map(bill => (
                <div key={bill.id} className="bg-white border-2 border-black rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:translate-x-1 hover:shadow-lg hover:shadow-slate-100 group">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-black shadow-md ${
                          bill.status === BillStatus.PAID || bill.status === BillStatus.APPROVED ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                          <FileText size={24} />
                      </div>
                      <div>
                          <p className="text-lg font-black text-slate-900 leading-tight">{bill.month}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Amount: {business?.currency}{bill.amount.toFixed(0)}</p>
                      </div>
                  </div>

                  <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                      <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${
                          bill.status === BillStatus.PAID || bill.status === BillStatus.APPROVED
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-rose-50 border-rose-500 text-rose-700'
                      }`}>
                          {bill.status}
                      </div>

                      {bill.status === BillStatus.PENDING && (
                          <button 
                              disabled={isProcessing}
                              onClick={() => handlePay(bill)}
                              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center gap-2 border-2 border-black"
                          >
                              {isProcessing ? 'Connecting...' : (
                                <>
                                  Pay with bKash <CreditCard size={14} />
                                </>
                              )}
                          </button>
                      )}
                      
                      {(bill.status === BillStatus.PAID || bill.status === BillStatus.APPROVED) && (
                        <div className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                           Thank you! <CheckCircle size={14} />
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-12 p-8 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[2rem] text-center">
            <h4 className="text-indigo-900 font-black uppercase text-xs tracking-widest mb-2">Need Help with Billing?</h4>
            <p className="text-indigo-600 text-[10px] font-medium leading-relaxed max-w-sm mx-auto">If you have any issues with your payment or plan, please contact our support at support@restokeep.app or call 01303565316.</p>
        </div>
      </div>
    </div>
  );
};
