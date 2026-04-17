// --- CONFIGURATION ---
const MY_TENANT_ID = process.argv[2] || '01'; 

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

console.log('--- RestoKeep Automatic Printer Agent Starting ---');
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);

// --- TASK QUEUE SYSTEM ---
// This queue ensures prints happen one-by-one, preventing resource issues and duplicate prints
const printQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || printQueue.length === 0) return;
    
    isProcessing = true;
    const { request, requestId } = printQueue.shift();
    
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Processing print job. Queue remaining: ${printQueue.length}`);
        await performPrint(request, requestId);
    } catch (err) {
        console.error(`Queue error for Request ${requestId}:`, err);
    } finally {
        isProcessing = false;
        // Process next item after a small delay to let printer catch up
        setTimeout(processQueue, 1500);
    }
}

// Function to delete the print request from Firestore
async function deletePrintRequest(requestId) {
    try {
        await deleteDoc(doc(db, 'print_requests', requestId));
        console.log(`[${new Date().toLocaleTimeString()}] Deleted request ${requestId} from Cloud.`);
    } catch (error) {
        // Silently fail or log sparingly - sometimes it's already deleted
    }
}

// Check for default printer
exec('powershell -Command "Get-WmiObject -Query \\"SELECT Name FROM Win32_Printer WHERE Default = TRUE\\" | Select-Object -ExpandProperty Name"', (err, stdout) => {
    if (!err && stdout) {
        console.log(`Current Default Printer: ${stdout.trim()}`);
    } else {
        console.log('Warning: No default printer detected via PowerShell.');
    }
});

const processedRequests = new Set();
const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', 'in', [MY_TENANT_ID, parseInt(MY_TENANT_ID) || MY_TENANT_ID]),
    orderBy('createdAt', 'desc'),
    limit(15)
);

console.log(`Listening for print requests...`);

onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;

            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const createdAt = request.createdAt?.toDate ? request.createdAt.toDate().getTime() : Date.now();

            if (!processedRequests.has(requestId)) {
                if (createdAt > fiveMinutesAgo) {
                    console.log(`[${new Date().toLocaleTimeString()}] Added to queue: Order ${request.orderId} (Token ${request.tokenNumber})`);
                    printQueue.push({ request, requestId });
                    processQueue();
                }
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => {
    console.error('Firestore Fetch Error:', error);
});

async function performPrint(order, requestId, attempt = 1, startTime = Date.now()) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, `temp_${requestId}.html`);
    const pdfFilePath = filePath + '.pdf';
    const profilePath = path.join(__dirname, `profile_${requestId}`);
    
    return new Promise((resolve, reject) => {
        // --- TIMEOUT CHECK ---
        const currentAge = Date.now() - startTime;
        if (currentAge > 60000) {
            console.error(`[${new Date().toLocaleTimeString()}] JOB EXPIRED: Request ${requestId} exceeded 60s limit.`);
            deletePrintRequest(requestId);
            cleanupFiles(filePath, pdfFilePath, profilePath);
            return resolve(); // Resolve to unblock queue
        }

        try {
            fs.writeFileSync(filePath, html);
            
            const convertCommand = `powershell -Command "$edge = (Get-ChildItem 'C:\\Program Files*\\Microsoft\\Edge\\Application\\msedge.exe' | Select-Object -First 1).FullName; if ($edge) { & \\"$edge\\" --headless=new --no-sandbox --disable-gpu --user-data-dir=\\\"${profilePath}\\\" --no-pdf-header-footer --print-to-pdf=\\\"${pdfFilePath}\\\" \\\"${filePath}\\\" } else { msedge --headless=new --no-sandbox --disable-gpu --user-data-dir=\\\"${profilePath}\\\" --no-pdf-header-footer --print-to-pdf=\\\"${pdfFilePath}\\\" \\\"${filePath}\\\" }"`;

            console.time(`job-${requestId}`);
            exec(convertCommand, { timeout: 15000 }, (err) => {
                if (err && !fs.existsSync(pdfFilePath)) {
                    console.timeEnd(`job-${requestId}`);
                    cleanupFiles(filePath, pdfFilePath, profilePath);
                    console.error(`[${new Date().toLocaleTimeString()}] Edge Error:`, err.message);
                    handleRetry(order, requestId, attempt, resolve, reject, startTime);
                    return;
                }

                let checkAttempts = 0;
                const checkFile = setInterval(() => {
                    checkAttempts++;
                    if (fs.existsSync(pdfFilePath)) {
                        clearInterval(checkFile);
                        
                        const sumatraPath = 'C:\\PrinterService\\SumatraPDF\\SumatraPDF.exe';
                        const printCommand = `"${sumatraPath}" -print-to "XP-80C" -silent -print-settings "noscale" "${pdfFilePath}"`;

                        exec(printCommand, { timeout: 15000 }, (fbError) => {
                            console.timeEnd(`job-${requestId}`);
                            if (fbError) {
                                console.error('SumatraPDF error:', fbError.message);
                                cleanupFiles(filePath, pdfFilePath, profilePath);
                                handleRetry(order, requestId, attempt, resolve, reject, startTime);
                            } else {
                                console.log(`[${new Date().toLocaleTimeString()}] PRINT SUCCESS: Request ${requestId}`);
                                deletePrintRequest(requestId);
                                setTimeout(() => cleanupFiles(filePath, pdfFilePath, profilePath), 5000);
                                resolve();
                            }
                        });
                    } else if (checkAttempts > 20) { // Wait up to 10 seconds
                        clearInterval(checkFile);
                        console.timeEnd(`job-${requestId}`);
                        cleanupFiles(filePath, pdfFilePath, profilePath);
                        console.error(`[${new Date().toLocaleTimeString()}] PDF creation timeout for ${requestId}`);
                        handleRetry(order, requestId, attempt, resolve, reject, startTime);
                    }
                }, 500); 
            });
        } catch (err) {
            handleRetry(order, requestId, attempt, resolve, reject, startTime);
        }
    });
}

function handleRetry(order, requestId, attempt, resolve, reject, startTime) {
    const currentAge = Date.now() - startTime;
    
    if (currentAge < 60000 && attempt < 3) {
        console.log(`Retrying Request ${requestId} (Attempt ${attempt + 1}/3)... Remaining time: ${Math.round((60000-currentAge)/1000)}s`);
        setTimeout(() => performPrint(order, requestId, attempt + 1, startTime).then(resolve).catch(reject), 2000);
    } else {
        if (currentAge >= 60000) {
            console.error(`Skipping Request ${requestId}: Time limit of 60s reached.`);
        } else {
            console.error(`Gave up on Request ${requestId} after ${attempt} attempts.`);
        }
        deletePrintRequest(requestId);
        resolve(); // Unblock queue
    }
}

function cleanupFiles(filePath, pdfFilePath, profilePath) {
    try { 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        if (profilePath && fs.existsSync(profilePath)) {
            // Delete Edge temporary profile folder to avoid conflicts and save space
            exec(`rmdir /s /q "${profilePath}"`);
        }
    } catch(e) {}
}

function generateReceiptHtml(order, requestId) {
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            const price = Number(item.price || 0);
            const total = price * item.quantity;
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; font-size: 8pt; font-weight: bold; border-bottom: 1px dashed #000; padding: 4px 0; gap: 2px;">
                    <span style="flex: 1; word-break: break-word; padding-right: 5px;">${item.name}</span>
                    <div style="display: flex; gap: 12px; white-space: nowrap; align-items: baseline;">
                        <span style="min-width: 15px; text-align: center;">${item.quantity}</span>
                        <span style="min-width: 30px; text-align: right;">${price.toFixed(0)}</span>
                        <span style="min-width: 40px; text-align: right;">${total.toFixed(0)}</span>
                    </div>
                </div>
            `;
        });
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { size: 80mm auto; margin: 2mm; }
            html, body { margin: 0; padding: 0; background-color: #ffffff; height: auto; width: 68mm; }
            body { font-family: 'SolaimanLipi', 'Arial', 'Vrinda', sans-serif; width: 68mm; margin: 0 auto; padding: 10px 5px 0 5px; color: #000; font-size: 8pt; overflow: hidden; }
            .container { display: block; width: 100%; padding: 0; margin: 0; text-align: center; position: relative; }
            .restaurant-name { font-size: 12pt; font-weight: bold; margin-bottom: 2px; }
            .restaurant-address { font-size: 8pt; margin-bottom: 5px; }
            .header-line { font-weight: bold; margin: 0; padding: 0; text-align: center; line-height: 1.1; font-size: 8pt; }
            #token-line { font-size: 8pt; margin-top: 5px; }
            .date-time-row { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 1px 0; margin: 2px 0; font-weight: bold; font-size: 8pt; }
            .items-container { width: 100%; text-align: left; }
            .note-box { margin-top: 4px; padding: 2px; border: 1px dashed #000; font-style: italic; font-size: 8pt; word-break: break-word; text-align: left; }
            .footer { text-align: center; border-top: 1px solid #000; margin-top: 6px; padding-top: 1px; font-weight: bold; font-size: 8pt; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="restaurant-name">${order.businessName || 'Restaurant'}</div>
            ${order.businessAddress ? `<div class="restaurant-address">${order.businessAddress}</div>` : ''}
            <div id="token-line" class="header-line">Kitchen Token: #${order.tokenNumber || '00'}</div>
            <div class="header-line">Table No: ${order.tableNumber || 'N/A'}</div>
            <div class="header-line">Ordered by: ${order.creatorName || 'Staff'}</div>
            <div class="date-time-row"><span>Date: ${dateStr}</span><span>Time: ${timeStr}</span></div>
            <div class="items-container">${itemsHtml}</div>
            ${order.note ? `<div class="note-box">Note: ${order.note}</div>` : ''}
            <div class="footer">--- End of Ticket ---</div>
        </div>
    </body>
    </html>
    `;
}
