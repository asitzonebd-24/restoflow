
import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { BluetoothPrinterService } from '../../services/printerService';
import { toast } from 'sonner';

export const PrinterRelay: React.FC = () => {
    const { business, relayMode } = useApp();
    const processingRef = useRef<boolean>(false);
    const lastProcessedId = useRef<string | null>(null);
    const wakeLockRef = useRef<any>(null);
    const sessionStartTime = useRef<number>(Date.now());
    
    // Function to keep screen on
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                console.log('[PrinterRelay] Wake Lock active');
            }
        } catch (err) {
            console.error('[PrinterRelay] Wake Lock failed:', err);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    useEffect(() => {
        if (relayMode) {
            requestWakeLock();
            // Handle re-requesting when page becomes visible again
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                releaseWakeLock();
            };
        }
    }, [relayMode]);

    useEffect(() => {
        if (!relayMode || !business?.id) return;

        console.log('[PrinterRelay] Starting listener for tenant:', business.id);
        
        // Query for new print requests for this tenant
        const q = query(
            collection(db, 'print_requests'),
            where('tenantId', '==', business.id),
            orderBy('createdAt', 'asc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty || processingRef.current) return;

            processingRef.current = true;
            
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added') {
                    const printData = { id: change.doc.id, ...change.doc.data() } as any;
                    
                    // 1. Backlog Protection: Ignore requests created more than 2 minutes before this session started
                    // This prevents "printing everything that was missed" when first turning on relay
                    const requestTime = printData.createdAt ? new Date(printData.createdAt).getTime() : Date.now();
                    if (requestTime < sessionStartTime.current - 120000) { // 2 minutes grace
                        console.log('[PrinterRelay] Skipping old backlog request:', printData.id);
                        // Optional: Delete these old requests? For now just skip
                        continue;
                    }

                    // Avoid duplicate processing if multiple snapshots fire
                    if (lastProcessedId.current === printData.id) continue;
                    
                    try {
                        console.log('[PrinterRelay] Processing job:', printData.id, 'Type:', printData.type);
                        
                        // 1. Ensure we are connected to the printer
                        const pairedPrinterId = business.printerSettings?.pairedPrinterId;
                        if (!pairedPrinterId) {
                            toast.error('Relay active but no printer paired in Settings!');
                            break;
                        }

                        // Use a silent connect to avoid background picker errors
                        const connection = await BluetoothPrinterService.connect(pairedPrinterId, true);
                        if (!connection.success) {
                            console.error('[PrinterRelay] Failed to connect to printer:', connection.error);
                            
                            if (connection.error === 'gesture_required') {
                                // This means the browser lost the permission and needs a manual click
                                toast.error('Relay: Printer needs re-pairing. Please go to Settings and click Connect.');
                            } else if (connection.error === 'unsupported') {
                                toast.error('Relay: Bluetooth is not supported on this device.');
                            } else {
                                // This is usually "failed" - likely the printer is off
                                toast.error('Relay: Printer off or out of range.');
                            }
                            break;
                        }

                        // 2. Perform the print based on type
                        if (printData.type === 'kot') {
                            await BluetoothPrinterService.printKOT(business, printData);
                        } else {
                            // For invoice, we might need more details. 
                            // printInvoice takes (business, order, transaction)
                            // We pass printData as order and transaction info
                            await BluetoothPrinterService.printInvoice(business, printData, {
                                creatorName: printData.creatorName,
                                discount: printData.discount || 0
                            });
                        }

                        // 3. Mark as READY if requested
                        if (printData.autoMarkReady && printData.orderId) {
                            try {
                                const orderRef = doc(db, 'orders', printData.orderId);
                                const orderSnap = await getDoc(orderRef);
                                if (orderSnap.exists()) {
                                    const orderData = orderSnap.data();
                                    const updatedItems = orderData.items.map((item: any) => {
                                        const printedItem = printData.items?.find((pi: any) => pi.rowId === item.rowId);
                                        if (printedItem && item.status === 'PENDING') {
                                            return { ...item, status: 'READY' };
                                        }
                                        return item;
                                    });

                                    const allReady = updatedItems.every((i: any) => 
                                        ['READY', 'COMPLETED', 'CANCELLED'].includes(i.status)
                                    );

                                    await updateDoc(orderRef, {
                                        items: updatedItems,
                                        status: allReady ? 'READY' : orderData.status
                                    });
                                    console.log('[PrinterRelay] Order updated to READY for items in:', printData.id);
                                }
                            } catch (updateErr) {
                                console.error('[PrinterRelay] Error updating order status:', updateErr);
                            }
                        }

                        // 4. Delete the request after successful print
                        await deleteDoc(doc(db, 'print_requests', printData.id));
                        lastProcessedId.current = printData.id;
                        console.log('[PrinterRelay] Job completed and deleted:', printData.id);
                        
                    } catch (error) {
                        console.error('[PrinterRelay] Error processing print job:', error);
                        toast.error('Relay: Error while printing. Check device connection.');
                    }
                }
            }
            
            processingRef.current = false;
        }, (error) => {
            console.error('[PrinterRelay] Listener error:', error);
            processingRef.current = false;
        });

        return () => {
            console.log('[PrinterRelay] Stopping listener');
            unsubscribe();
        };
    }, [relayMode, business]);

    if (!relayMode) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] animate-pulse">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Relay Active</span>
            </div>
        </div>
    );
};
