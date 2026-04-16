// --- CONFIGURATION ---
// You can pass the Tenant ID as a command line argument: node agent.js 02
// If no argument is passed, it defaults to '01'
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
// ---------------------

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, Timestamp, doc, deleteDoc } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log('--- RestoKeep Automatic Printer Agent Starting ---');
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);

// Function to delete the print request from Firestore
async function deletePrintRequest(requestId) {
    try {
        await deleteDoc(doc(db, 'print_requests', requestId));
        console.log(`[${new Date().toLocaleTimeString()}] Successfully deleted print request ${requestId} from Firestore.`);
    } catch (error) {
        console.error(`Error deleting print request ${requestId}:`, error);
    }
}

// Check for default printer
exec('powershell -Command "Get-WmiObject -Query \\"SELECT Name FROM Win32_Printer WHERE Default = TRUE\\" | Select-Object -ExpandProperty Name"', (err, stdout) => {
    if (!err && stdout) {
        console.log(`Default Printer detected: ${stdout.trim()}`);
    } else {
        console.log('Warning: Could not detect default printer. Please ensure a printer is set as default in Windows.');
    }
});

console.log('Listening for new print requests in real-time...');

// Keep track of processed requests to avoid double printing
const processedRequests = new Set();

// Listen for new print requests
// We'll start by getting the last 5 requests to see if we can connect at all
// Then we'll filter them in the code to avoid printing old ones
const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', 'in', [MY_TENANT_ID, parseInt(MY_TENANT_ID) || MY_TENANT_ID]), // Try both string and number
    orderBy('createdAt', 'desc'),
    limit(10)
);

console.log(`Connecting to Firestore listener for Tenant ID: ${MY_TENANT_ID}...`);

onSnapshot(q, (snapshot) => {
    console.log(`[${new Date().toLocaleTimeString()}] Listener update: ${snapshot.size} orders found for this tenant.`);
    
    if (snapshot.empty) {
        console.log('No orders found for this tenant. Waiting...');
    }
    
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;

            // Only process if it's new (created within the last 5 minutes)
            // This avoids printing very old orders when the agent starts
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const createdAt = request.createdAt?.toDate ? request.createdAt.toDate().getTime() : 0;

            if (!processedRequests.has(requestId)) {
                if (createdAt > fiveMinutesAgo) {
                    console.log(`\n[${new Date().toLocaleTimeString()}] New Print Request Detected!`);
                    console.log(`Order ID: ${request.orderId}`);
                    console.log(`Token: ${request.tokenNumber}`);
                    console.log(`Tenant ID in DB: ${request.tenantId} (Type: ${typeof request.tenantId})`);
                    
                    printOrder(request, requestId);
                } else {
                    console.log(`Skipping old order: ${request.orderId} (Created at: ${new Date(createdAt).toLocaleString()})`);
                }
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => {
    console.error('Firestore Listen Error:', error);
    if (error.code === 'permission-denied') {
        console.error('ERROR: Permission denied. Please check your Firestore rules.');
    } else if (error.message.includes('index')) {
        console.error('ERROR: Missing Firestore Index. Please click the link in the error message to create it.');
    }
});

function printOrder(order, requestId, attempt = 1) {
    const html = generateReceiptHtml(order, requestId);
    // Use unique filename for each request to avoid race conditions
    const filePath = path.join(__dirname, `temp_receipt_${requestId}.html`);
    const pdfFilePath = filePath + '.pdf';
    
    try {
        fs.writeFileSync(filePath, html);
        console.log(`Generated temporary receipt file (Attempt ${attempt}): ${filePath}`);
        
        // 1. HTML ফাইলটিকে PDF এ কনভার্ট করা
        const convertCommand = `powershell -Command "Start-Process 'msedge' -ArgumentList '--headless', '--print-to-pdf=\\\"${pdfFilePath}\\\"', '${filePath}' -Wait"`;

        exec(convertCommand, (err) => {
            if (err) {
                 console.error('PDF conversion failed:', err);
                 // পিডিএফ কনভার্সনে ফেইল করলেও রিট্রাই করা উচিত
                 handleRetry(order, requestId, attempt, err, filePath, pdfFilePath);
                 return;
            }

            // 2. ফাইলটি তৈরি হতে কিছুটা সময় দেওয়া
            let attempts = 0;
            const checkFile = setInterval(() => {
                attempts++;
                if (fs.existsSync(pdfFilePath) || attempts > 10) {
                    clearInterval(checkFile);
                    
                    if (fs.existsSync(pdfFilePath)) {
                        // 3. প্রিন্ট করা (noscale ব্যবহার করছি যাতে রিসিপ্টটি ছোট না হয়ে যায়)
                        const sumatraPath = 'C:\\PrinterService\\SumatraPDF\\SumatraPDF.exe';
                        const printCommand = `"${sumatraPath}" -print-to "XP-80C" -silent -print-settings "noscale" "${pdfFilePath}"`;

                        console.log('Sending PDF to XP-80C...');
                        exec(printCommand, (fbError) => {
                            // ফাইল পরিষ্কার করা
                            setTimeout(() => { 
                                try { 
                                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                                    if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
                                } catch(e) { console.error('Error cleaning files:', e); }
                            }, 5000); 
                            
                            if (fbError) {
                                console.error('SumatraPDF print command failed:', fbError);
                                handleRetry(order, requestId, attempt, fbError, filePath, pdfFilePath);
                            } else {
                                console.log(`SUCCESS: PDF print command sent to XP-80C.`);
                                deletePrintRequest(requestId);
                            }
                        });
                    } else {
                        console.error('PDF file was not created by MS Edge.');
                        handleRetry(order, requestId, attempt, new Error('PDF file not created'), filePath, pdfFilePath);
                    }
                }
            }, 1000); // প্রতি সেকেন্ডে চেক করবে
        });
    } catch (err) {
        console.error('File Write Error:', err);
        handleRetry(order, requestId, attempt, err, filePath, pdfFilePath);
    }
}

function handleRetry(order, requestId, attempt, error, filePath, pdfFilePath) {
    // Retry cleanup
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
    } catch (e) {}

    if (attempt < 5) {
        const nextAttempt = attempt + 1;
        console.log(`Retrying print for Order ${order.orderId} in 5 seconds... (Attempt ${nextAttempt}/5)`);
        setTimeout(() => printOrder(order, requestId, nextAttempt), 5000);
    } else {
        console.error(`Max retries reached for Order ${order.orderId}. System will stop trying this Ticket.`);
    }
}

function generateReceiptHtml(order, requestId) {
    // Handle both Firestore Timestamp and ISO string
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let itemsHtml = '';
    
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; font-size: 10pt; font-weight: bold; border-bottom: 1px dashed #000; padding: 2px 0; gap: 5px;">
                    <span style="flex: 1; word-break: break-word;">${item.name}</span>
                    <span style="white-space: nowrap;">x${item.quantity}</span>
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
            @import url('https://cdn.jsdelivr.net/gh/at-shuvro/solaimanlipi-font@master/solaimanlipi.css');
            
            @page {
                size: 80mm auto;
                margin: 2mm;
            }

            html, body {
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                height: auto;
                width: 68mm;
            }

            body { 
                font-family: 'SolaimanLipi', 'Arial', sans-serif; 
                width: 68mm; 
                margin: 0 auto;
                padding: 15px 5px 0 5px;
                color: #000;
                font-size: 20pt;
                overflow: hidden;
            }

            .container {
                display: block;
                width: 100%;
                padding: 0;
                margin: 0;
                text-align: center;
                position: relative;
                margin-top: -15px; /* More aggressive pull up */
            }

            .header-line {
                font-weight: bold;
                margin: 0;
                padding: 0;
                text-align: center;
                line-height: 1.1;
                font-size: 10pt;
            }
            #token-line {
                font-size: 16pt;
                margin-bottom: 3px;
            }

            .date-time-row {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #000;
                padding: 1px 0;
                margin: 2px 0;
                font-weight: bold;
                font-size: 9pt;
            }

            .items-container { 
                width: 100%; 
                text-align: left;
            }
            
            .note-box { 
                margin-top: 4px; 
                padding: 2px; 
                border: 1px dashed #000; 
                font-style: italic; 
                font-size: 9pt; 
                word-break: break-word;
                text-align: left;
            }
            
            .footer { 
                text-align: center; 
                border-top: 1px solid #000; 
                margin-top: 6px; 
                padding-top: 1px; 
                font-weight: bold; 
                font-size: 9pt;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div id="token-line" class="header-line">Kitchen Token: #${order.tokenNumber || '00'}</div>
            <div class="header-line">Table No: ${order.tableNumber || 'N/A'}</div>
            <div class="header-line">Ordered by: ${order.creatorName || 'Staff'}</div>
            
            <div class="date-time-row">
                <span>Date: ${dateStr}</span>
                <span>Time: ${timeStr}</span>
            </div>

            <div class="items-container">
                ${itemsHtml}
            </div>

            ${order.note ? `<div class="note-box">Note: ${order.note}</div>` : ''}

            <div class="footer">
                --- End of Ticket ---
            </div>
        </div>
    </body>
    </html>
    `;
}
