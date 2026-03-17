
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus, Order, Transaction, OrderItem } from '../types';
import { Receipt, CheckCheck, Printer, Download, X, FileText, Hash } from 'lucide-react';

export const Billing = () => {
  const { orders, currentTenant, updateOrderStatus, addTransaction, users } = useApp();
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  
  const readyOrders = orders.filter(o => o.status === OrderStatus.READY);

  const getCreator = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const calculateTotal = (order: Order) => {
    const subtotal = order.totalAmount;
    const vat = currentTenant?.includeVat ? (subtotal * ((currentTenant?.vatRate || 0) / 100)) : 0;
    return { subtotal, vat, total: subtotal + vat };
  };

  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const existing = acc.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  };

  const handlePayment = (order: Order) => {
    const { total } = calculateTotal(order);
    const groupedItems = groupItems(order.items);
    const creator = getCreator(order.createdBy);
    
    const transaction = {
        id: `txn-${Date.now()}`,
        orderId: order.id,
        amount: total,
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        itemsSummary: groupedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
        creatorName: creator?.name || 'Unknown'
    };
    
    addTransaction(transaction);
    updateOrderStatus(order.id, OrderStatus.COMPLETED);
    
    setInvoiceOrder(order);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-full space-y-8">
      <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
            <Receipt className="text-indigo-600" size={36}/> Billing Hub
          </h1>
          <span className="bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-sm">
            Active Ready: {readyOrders.length}
          </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {readyOrders.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
             <Receipt size={64} className="mx-auto text-slate-100 mb-6" />
             <h3 className="text-slate-300 font-black uppercase text-xl tracking-[0.2em]">Queue Empty</h3>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">No orders awaiting checkout</p>
          </div>
        ) : (
        readyOrders.map(order => {
            const { subtotal, vat, total } = calculateTotal(order);
            const groupedItems = groupItems(order.items);
            
            // Standardized identification of online orders using business prefix
            const prefix = currentTenant.customerTokenPrefix || 'WEB';
            const isOnline = order.tokenNumber.startsWith(prefix) || order.tokenNumber === 'OO';
            const headerLabel = isOnline ? 'Online Order' : 'Counter Token';

            return (
            <div key={order.id} className="bg-white rounded-[2.5rem] p-5 shadow-xl border-t-8 border-t-emerald-500 border-x-4 border-b-4 border-slate-900 flex flex-col justify-between min-h-[400px] transition-transform hover:-translate-y-2">
                <div>
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{headerLabel}</span>
                         <div className="px-5 py-2 bg-emerald-500 text-white rounded-2xl border-2 border-slate-900 shadow-md">
                            <span className="text-xl font-black tracking-tighter">#{order.tokenNumber}</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total</span>
                         <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{currentTenant?.currency}{total.toFixed(0)}</span>
                      </div>
                   </div>

                   <div className="space-y-2 mb-6 max-h-40 overflow-y-auto no-scrollbar border-y-2 border-slate-50 py-4">
                      {groupedItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-600 flex gap-2">
                               <span className="font-black text-indigo-600">{item.quantity}x</span>
                               <span className="truncate max-w-[140px]">{item.name}</span>
                            </span>
                            <span className="text-slate-400">{currentTenant?.currency}{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                      ))}
                   </div>

                   {order.deliveryAddress && (
                      <div className="mb-6 p-3 bg-indigo-50 border-2 border-indigo-100 rounded-2xl">
                         <div className="flex items-center gap-2 mb-1">
                            <MapPin size={10} className="text-indigo-600" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600">Destination</span>
                         </div>
                         <p className="text-[9px] font-black text-slate-900 uppercase truncate">{order.deliveryAddress}</p>
                      </div>
                   )}
                </div>

                <button 
                   onClick={() => handlePayment(order)}
                   className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-black transition transform active:scale-95 flex items-center justify-center gap-3 border-4 border-white"
                >
                   Collect Payment <CheckCheck size={20} strokeWidth={3} />
                </button>
            </div>
          );
        })
        )}
      </div>

      {invoiceOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border-[6px] border-white animate-in zoom-in-95 print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 print:hidden">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[10px] tracking-widest"><FileText size={18} className="text-indigo-600"/> Payment Confirmation</h3>
                <button onClick={() => setInvoiceOrder(null)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-xl border-2 border-slate-100 transition active:scale-90"><X size={20}/></button>
             </div>
             
             <div className="p-10 overflow-y-auto flex-1 no-scrollbar" id="invoice-content">
                <div className="text-center mb-10">
                   {currentTenant?.logo && <img src={currentTenant.logo} className="h-20 w-20 mx-auto mb-4 rounded-full border-4 border-slate-900 shadow-xl" alt="Logo"/>}
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">{currentTenant?.name}</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{currentTenant?.address}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Tel: {currentTenant?.phone}</p>
                </div>
                
                <div className="border-y-4 border-slate-900 border-dashed py-8 mb-8 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service Token</span>
                    <span className="text-5xl text-indigo-600 font-black tracking-tighter leading-none">#{invoiceOrder.tokenNumber}</span>
                </div>

                <table className="w-full text-[10px] mb-10">
                   <thead>
                      <tr className="border-b-4 border-slate-900 text-slate-900 font-black uppercase tracking-widest">
                         <th className="text-left py-4">Selection</th>
                         <th className="text-right py-4">Subtotal</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-2 divide-slate-100">
                      {groupItems(invoiceOrder.items).map((item, i) => (
                         <tr key={i} className="font-black uppercase tracking-tight text-slate-900">
                            <td className="py-4">
                               <div className="flex items-center gap-3">
                                  <span className="text-indigo-600">x{item.quantity}</span>
                                  <span>{item.name}</span>
                               </div>
                            </td>
                            <td className="text-right py-4">{currentTenant?.currency}{(item.price * item.quantity).toFixed(0)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                <div className="space-y-3">
                    {(() => {
                        // Fix: replaced calculateInvoiceTotal with calculateTotal which is defined above
                        const { subtotal, vat, total } = calculateTotal(invoiceOrder);
                        return (
                            <>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                   <span>Subtotal</span>
                                   <span>{currentTenant?.currency}{subtotal.toFixed(0)}</span>
                                </div>
                                {currentTenant?.includeVat && (
                                   <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                      <span>VAT ({currentTenant?.vatRate}%)</span>
                                      <span>{currentTenant?.currency}{vat.toFixed(0)}</span>
                                   </div>
                                )}
                                <div className="flex justify-between font-black text-4xl mt-10 border-t-4 border-slate-900 pt-8 tracking-tighter text-slate-900 leading-none">
                                   <span>TOTAL</span>
                                   <span>{currentTenant?.currency}{total.toFixed(0)}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
                
                <div className="text-center mt-16 pt-8 border-t-4 border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2 leading-none">Thank You For Dining With Us</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">OmniDine Professional Terminal</p>
                </div>
             </div>

             <div className="p-10 border-t border-slate-50 bg-slate-50 flex gap-4 print:hidden shrink-0">
                <button 
                   onClick={printInvoice} 
                   className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-6 rounded-[2.5rem] hover:bg-black transition font-black uppercase tracking-widest text-[11px] shadow-2xl border-4 border-white"
                >
                   <Printer size={22} strokeWidth={3} /> Print Invoice
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MapPin = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
