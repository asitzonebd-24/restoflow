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
        // We also clear the Registry keys for Header and Footer to remove "Page 1 of 1" and file path
        const psCommand = `powershell -Command "$p = 'HKCU:\\Software\\Microsoft\\Internet Explorer\\PageSetup'; Set-ItemProperty -Path $p -Name 'header' -Value ''; Set-ItemProperty -Path $p -Name 'footer' -Value ''; Set-ItemProperty -Path $p -Name 'margin_bottom' -Value '0'; Set-ItemProperty -Path $p -Name 'margin_left' -Value '0'; Set-ItemProperty -Path $p -Name 'margin_right' -Value '0'; Set-ItemProperty -Path $p -Name 'margin_top' -Value '0'; $ie = New-Object -ComObject InternetExplorer.Application; $ie.Visible = $false; $ie.Navigate('${filePath}'); while($ie.ReadyState -ne 4){Start-Sleep -m 100}; $ie.ExecWB(6, 2); Start-Sleep -s 2; $ie.Quit()"`;
        
        console.log('Sending to printer (Silent Mode - No Headers)...');
        exec(psCommand, (error) => {
            if (error) {
                console.error(`PowerShell Print Error:`, error);
                
                // Fallback: rundll32
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
                width: 68mm; /* Slightly narrower to ensure no clipping */
                margin: 0;
                padding: 0;
                color: #000;
                font-size: 10pt;
                overflow: hidden;
            }

            .container {
                display: inline-block;
                width: 100%;
                padding: 0;
                margin: 0;
            }

            .header-line {
                font-weight: bold;
                margin-bottom: 2px;
                text-align: center;
            }

            .date-time-row {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
                margin-bottom: 5px;
                font-weight: bold;
                font-size: 9pt;
            }

            .items-container { width: 100%; }
            
            .note-box { 
                margin-top: 5px; 
                padding: 3px; 
                border: 1px dashed #000; 
                font-style: italic; 
                font-size: 10pt; 
                word-break: break-word;
            }
            
            .footer { 
                text-align: center; 
                border-top: 1px solid #000; 
                margin-top: 8px; 
                padding-top: 2px; 
                font-weight: bold; 
                font-size: 10pt;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-line" style="font-size: 12pt; border-bottom: 1px solid #eee;">Kitchen Token: #${order.tokenNumber || '00'}</div>
            <div class="header-line">Table No: ${order.tableNumber || 'Delivery'}</div>
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
