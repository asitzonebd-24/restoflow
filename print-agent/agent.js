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
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, Timestamp } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log('--- RestoKeep Automatic Printer Agent Starting ---');
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);

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

function printOrder(order, requestId) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, 'temp_receipt.html');
    
    try {
        fs.writeFileSync(filePath, html);
        console.log(`Generated temporary receipt file: ${filePath}`);
        
        // Method 1: PowerShell COM (Silent Printing)
        // ExecWB(6, 2) -> 6 is OLECMDID_PRINT, 2 is OLECMDEXECOPT_DONTPROMPTUSER
        const psCommand = `powershell -Command "$ie = New-Object -ComObject InternetExplorer.Application; $ie.Visible = $false; $ie.Navigate('${filePath}'); while($ie.ReadyState -ne 4){Start-Sleep -m 100}; $ie.ExecWB(6, 2); Start-Sleep -s 5; $ie.Quit()"`;
        
        console.log('Sending to printer (Silent Mode)...');
        exec(psCommand, (error) => {
            if (error) {
                console.error(`PowerShell Print Error:`, error);
                
                // Fallback: rundll32 (Might show dialog but works as last resort)
                console.log('Attempting Fallback Method (mshtml)...');
                const fallbackCommand = `rundll32.exe mshtml.dll,PrintHTML "${filePath}"`;
                
                exec(fallbackCommand, (fbError) => {
                    if (fbError) {
                        console.error('All print methods failed:', fbError);
                    } else {
                        console.log('Fallback print command sent.');
                    }
                });
            } else {
                console.log(`SUCCESS: Print command sent silently.`);
            }
        });
    } catch (err) {
        console.error('File Write Error:', err);
    }
}

function generateReceiptHtml(order, requestId) {
    // Handle both Firestore Timestamp and ISO string
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const date = createdAt.toLocaleString();
    
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
                margin: 0;
                size: auto;
            }

            html, body {
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                height: auto;
            }

            body { 
                font-family: 'SolaimanLipi', 'Arial', sans-serif; 
                width: 70mm; 
                margin: 0;
                padding: 0;
                color: #000;
                font-size: 10pt;
                overflow: hidden;
            }

            .kot-header { 
                text-align: center; 
                border-bottom: 1px solid #000; 
                padding-bottom: 4px; 
                margin-bottom: 5px; 
            }
            .kot-title { font-size: 10pt; font-weight: bold; margin: 0; }
            .token-box { 
                font-size: 14pt; 
                font-weight: 900; 
                margin: 2px 0; 
                border: 2px solid #000; 
                display: inline-block; 
                padding: 0 10px; 
            }
            .kot-info { font-size: 10pt; font-weight: bold; margin: 1px 0; }
            
            .items-container { width: 100%; }
            
            .note-box { 
                margin-top: 5px; 
                padding: 4px; 
                border: 1px dashed #000; 
                font-style: italic; 
                font-size: 10pt; 
                word-break: break-word;
            }
            
            .footer { 
                text-align: center; 
                border-top: 1px solid #000; 
                margin-top: 10px; 
                padding-top: 2px; 
                font-weight: bold; 
                font-size: 10pt;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <div class="kot-header">
            <div class="kot-title">KITCHEN TICKET</div>
            <div class="token-box">#${order.tokenNumber || '00'}</div>
            <div class="kot-info">Table: ${order.tableNumber || 'Delivery'}</div>
            <div class="kot-info">Waiter: ${order.creatorName || 'Staff'}</div>
            <div style="font-size: 9pt;">${date}</div>
        </div>

        <div class="items-container">
            ${itemsHtml}
        </div>

        ${order.note ? `<div class="note-box"><strong>Note:</strong> ${order.note}</div>` : ''}

        <div class="footer">
            --- End of Ticket ---
        </div>
    </body>
    </html>
    `;
}
