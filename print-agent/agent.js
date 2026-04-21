// --- CONFIGURATION ---
const MY_TENANT_ID = process.argv[2] || '01'; 
const PRINTER_NAME = "XP-80C"; // Change this to your printer name from Windows Control Panel
const SUMATRA_PATH = 'C:\\PrinterService\\SumatraPDF\\SumatraPDF.exe';

// Firebase Configuration
const firebaseConfig = {
  projectId: "restokeepsaas",
  appId: "1:757334125938:web:27946498b6e7f2054e01eb",
  apiKey: "AIzaSyDq_z1PGwFkbaWp8gzBMJusSvwerXAad8I",
  authDomain: "restokeepsaas.firebaseapp.com",
  firestoreDatabaseId: "restokeep-db",
  storageBucket: "restokeepsaas.firebasestorage.app",
  messagingSenderId: "757334125938"
};

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, doc, deleteDoc } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log(`\n\n[${new Date().toLocaleTimeString()}] --- RestoKeep Automatic Printer Agent Starting ---`);
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);

const printQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || printQueue.length === 0) return;
    isProcessing = true;
    const { request, requestId } = printQueue.shift();
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Printing Token: ${request.tokenNumber}. Jobs left: ${printQueue.length}`);
        await performPrint(request, requestId);
    } catch (err) {
        console.error(`Queue error for Request ${requestId}:`, err);
    } finally {
        isProcessing = false;
        setTimeout(processQueue, 1500);
    }
}

async function deletePrintRequest(requestId) {
    try {
        await deleteDoc(doc(db, 'print_requests', requestId));
    } catch (error) {}
}

const processedRequests = new Set();
const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', 'in', [MY_TENANT_ID, parseInt(MY_TENANT_ID) || MY_TENANT_ID]),
    orderBy('createdAt', 'desc'),
    limit(15)
);

console.log(`Listening for cloud print requests...`);

onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const createdAt = request.createdAt?.toDate ? request.createdAt.toDate().getTime() : Date.now();

            if (!processedRequests.has(requestId)) {
                if (createdAt > fiveMinutesAgo) {
                    printQueue.push({ request, requestId });
                    processQueue();
                }
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => console.error('Firestore Fetch Error:', error));

async function performPrint(order, requestId, attempt = 1, startTime = Date.now()) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, `temp_${requestId}.html`);
    const pdfFilePath = filePath + '.pdf';
    const profilePath = path.join(__dirname, `profile_${requestId}`);
    
    return new Promise((resolve) => {
        const currentAge = Date.now() - startTime;
        if (currentAge > 55000) { // Slightly less than 60s to ensure clean abort
            console.error(`[EXPIRED] Request ${requestId} exceeded timeout.`);
            deletePrintRequest(requestId);
            cleanupFiles(filePath, pdfFilePath, profilePath);
            return resolve();
        }

        try {
            console.log(`[Attempt ${attempt}] Rendering HTML for Token ${order.tokenNumber}...`);
            fs.writeFileSync(filePath, html, 'utf8');
            
            // Refined Edge command with better path handling and fallbacks
            const edgePaths = [
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            
            let edgeCmd = 'msedge'; // Default to PATH
            for (const p of edgePaths) {
                if (fs.existsSync(p)) {
                    edgeCmd = `"${p}"`;
                    break;
                }
            }

            const convertCommand = `${edgeCmd} --headless=new --no-sandbox --disable-gpu --disable-software-rasterizer --user-data-dir="${profilePath}" --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${filePath}"`;

            console.time(`job-${requestId}`);
            exec(convertCommand, { timeout: 20000 }, (err) => {
                if (err) {
                    console.error(`[Edge Error] attempt ${attempt}:`, err.message);
                }

                let checkAttempts = 0;
                const maxCheckAttempts = 20;
                const checkFile = setInterval(() => {
                    checkAttempts++;
                    if (fs.existsSync(pdfFilePath)) {
                        clearInterval(checkFile);
                        console.log(`[PDF Ready] printing...`);
                        const printCommand = `"${SUMATRA_PATH}" -print-to "${PRINTER_NAME}" -silent -print-settings "noscale" "${pdfFilePath}"`;
                        
                        exec(printCommand, { timeout: 15000 }, (fbError) => {
                            console.timeEnd(`job-${requestId}`);
                            if (!fbError) {
                                console.log(`[SUCCESS] Token: ${order.tokenNumber} printed.`);
                                deletePrintRequest(requestId);
                            } else {
                                console.error('Printer Execution Error:', fbError.message);
                                // We still delete if it was sent to printer spooler
                                deletePrintRequest(requestId);
                            }
                            // Cleanup after a delay to ensure printer handle is released
                            setTimeout(() => cleanupFiles(filePath, pdfFilePath, profilePath), 3000);
                            resolve();
                        });
                    } else if (checkAttempts >= maxCheckAttempts) {
                        clearInterval(checkFile);
                        console.timeEnd(`job-${requestId}`);
                        console.error(`[Timeout] PDF not generated within 10s for Token ${order.tokenNumber}`);
                        cleanupFiles(filePath, pdfFilePath, profilePath);
                        handleRetry(order, requestId, attempt, resolve, startTime);
                    }
                }, 500); 
            });
        } catch (err) { 
            console.error(`[Fatal Error]`, err);
            handleRetry(order, requestId, attempt, resolve, startTime); 
        }
    });
}

function handleRetry(order, requestId, attempt, resolve, startTime) {
    const currentAge = Date.now() - startTime;
    if (currentAge < 60000 && attempt < 3) {
        console.log(`[RETRY] Token ${order.tokenNumber} (Attempt ${attempt + 1}/3)`);
        setTimeout(() => performPrint(order, requestId, attempt + 1, startTime).then(resolve), 2000);
    } else {
        console.error(`[ABORTED] Token ${order.tokenNumber} failed too many times or expired.`);
        deletePrintRequest(requestId);
        resolve();
    }
}

function cleanupFiles(filePath, pdfFilePath, profilePath) {
    try { 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        if (profilePath && fs.existsSync(profilePath)) exec(`rmdir /s /q "${profilePath}"`);
    } catch(e) {}
}

function generateReceiptHtml(order, requestId) {
    const isInvoice = order.type === 'invoice';
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currency = order.currency || 'Tk';
    
    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            if (isInvoice) {
                itemsHtml += `
                    <div style="display: flex; justify-content: space-between; font-size: 10pt; border-bottom: 1px dashed #eee; padding: 4px 0;">
                        <span style="flex: 1;">${item.quantity} x ${item.name}</span>
                        <span style="font-weight: bold;">${currency}${(item.price * item.quantity).toFixed(0)}</span>
                    </div>`;
            } else {
                itemsHtml += `
                    <div style="display: flex; gap: 8px; font-size: 12pt; font-weight: bold; border-bottom: 1px dashed #000; padding: 5px 0;">
                        <span style="white-space: nowrap; min-width: 25px;">${item.quantity} x</span>
                        <span style="flex: 1; word-break: break-word;">${item.name}</span>
                    </div>`;
            }
        });
    }

    if (isInvoice) {
        const headerText = order.receiptHeader ? order.receiptHeader.replace(/\n/g, '<br>') : '';
        const footerText = order.receiptFooter ? order.receiptFooter.replace(/\n/g, '<br>') : 'Thank you for dining with us!<br>Please visit again.';
        
        return `
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        @page { size: ${order.paperWidth || '80mm'} auto; margin: 2mm; }
        html, body { margin: 0; padding: 0; background-color: #ffffff; width: ${order.paperWidth === '58mm' ? '54mm' : '72mm'}; }
        body { font-family: 'SolaimanLipi', 'Arial', sans-serif; margin: 0 auto; padding: 10px 5px; color: #000; font-size: 10pt; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .biz-name { font-size: 16pt; font-weight: bold; margin-bottom: 2px; }
        .biz-info { font-size: 9pt; color: #444; }
        .custom-header { margin-top: 5px; font-size: 9pt; font-style: italic; }
        .bill-info { display: flex; justify-content: space-between; margin: 10px 0; font-size: 9pt; border-bottom: 1px solid #000; padding-bottom: 5px; }
        .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10pt; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14pt; font-weight: bold; border-top: 2px solid #000; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 9pt; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; }
        </style></head><body>
        <div class="header">
            <div class="biz-name">${order.businessName}</div>
            <div class="biz-info">${order.businessAddress || ''}</div>
            <div class="biz-info">Mob: ${order.businessMobile || ''}</div>
            ${headerText ? `<div class="custom-header">${headerText}</div>` : ''}
            <div style="font-size: 14pt; font-weight: bold; margin-top: 10px; text-decoration: underline;">INVOICE</div>
        </div>
        <div class="bill-info">
            <div>Token: <b>#${order.tokenNumber}</b><br>Table: ${order.tableNumber || 'N/A'}</div>
            <div style="text-align: right;">Date: ${dateStr}<br>Time: ${timeStr}</div>
        </div>
        <div style="margin-bottom: 15px;">${itemsHtml}</div>
        <div class="summary-row"><span>Subtotal</span><span>${currency}${(order.subtotal || 0).toFixed(2)}</span></div>
        ${order.vat > 0 ? `<div class="summary-row"><span>VAT</span><span>${currency}${(order.vat || 0).toFixed(2)}</span></div>` : ''}
        ${order.discount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${currency}${(order.discount || 0).toFixed(2)}</span></div>` : ''}
        <div class="total-row"><span>TOTAL</span><span>${currency}${(order.total || 0).toFixed(2)}</span></div>
        <div class="footer">${footerText}</div>
        </body></html>`;
    }

    return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 80mm auto; margin: 2mm; }
    html, body { margin: 0; padding: 0; background-color: #ffffff; height: auto; width: 68mm; }
    body { font-family: 'SolaimanLipi', 'Arial', 'Vrinda', sans-serif; width: 68mm; margin: 0 auto; padding: 10px 5px 0 5px; color: #000; font-size: 10pt; overflow: hidden; }
    .container { display: block; width: 100%; text-align: center; }
    .token-line { font-size: 12pt; font-weight: bold; margin-bottom: 3px; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .info-line { font-size: 12pt; font-weight: bold; margin: 1px 0; text-align: center; }
    .date-time-row { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 1px 0; margin: 4px 0; font-weight: bold; font-size: 10pt; }
    .footer { text-align: center; border-top: 1px solid #000; margin-top: 8px; padding-top: 2px; font-weight: bold; font-size: 10pt; }
    </style></head><body><div class="container">
    <div class="token-line">Kitchen Token: #${order.tokenNumber || '00'}</div>
    <div class="info-line">Table No: ${order.tableNumber || 'N/A'}</div>
    <div class="info-line">Ordered by: ${order.creatorName || 'Staff'}</div>
    <div class="date-time-row"><span>Date: ${dateStr}</span><span>Time: ${timeStr}</span></div>
    <div style="width: 100%; text-align: left;">${itemsHtml}</div>
    ${order.note ? `<div style="margin-top: 6px; padding: 3px; border: 1px dashed #000; font-style: italic; font-size: 12pt; text-align: left; font-weight: bold;">Note: ${order.note}</div>` : ''}
    <div class="footer">--- Kitchen Copy ---</div>
    </div></body></html>`;
}
