
import html2canvas from 'html2canvas';
import { Business, Order, OrderItem } from '../types';

export class BluetoothPrinterService {
  private static device: any = null;
  private static server: any = null;
  private static characteristic: any = null;

  // Standard ESC/POS commands
  private static readonly ESC = 0x1B;
  private static readonly GS = 0x1D;
  private static readonly LF = 0x0A;

  private static readonly COMMANDS = {
    INIT: [0x1B, 0x40],
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    DOUBLE_HEIGHT_ON: [0x1B, 0x21, 0x10],
    DOUBLE_WIDTH_ON: [0x1B, 0x21, 0x20],
    DOUBLE_SIZE_ON: [0x1B, 0x21, 0x30],
    SIZE_NORMAL: [0x1B, 0x21, 0x00],
    CUT: [0x1D, 0x56, 0x41, 0x03],
    GS_V_0: [0x1D, 0x76, 0x30, 0x00],
  };

  private static containsBangla(text: string): boolean {
    return /[\u0980-\u09FF]/.test(text);
  }

  private static async renderTextToCanvas(text: string, width: number, options: { 
    fontSize?: number, 
    bold?: boolean, 
    align?: 'left' | 'center' | 'right' 
  } = {}): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const scale = 2; // Increase scale for better rendering
    canvas.width = width * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const fontSize = (options.fontSize || 24) * scale;
    const fontName = '"Inter", "Hind Siliguri", sans-serif';
    const fontString = `${options.bold ? 'bold ' : ''}${fontSize}px ${fontName}`;
    
    // Ensure font is loaded
    try {
      await document.fonts.load(fontString);
    } catch (e) {
      console.warn('Font loading failed, falling back to default:', e);
    }
    
    ctx.font = fontString;
    ctx.scale(scale, scale);

    const lines = text.split('\n');
    canvas.height = lines.length * (fontSize + 8);

    // Fill background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = 'black';
    ctx.font = fontString;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      let x = 0;
      if (options.align === 'center') {
        x = (width - ctx.measureText(line).width) / 2;
      } else if (options.align === 'right') {
        x = width - ctx.measureText(line).width;
      }
      ctx.fillText(line, x, i * (fontSize + 8));
    });

    return canvas;
  }

  private static async printCanvas(canvas: HTMLCanvasElement) {
    const width = canvas.width;
    const height = canvas.height;
    const widthBytes = Math.ceil(width / 8);
    
    const context = canvas.getContext('2d');
    if (!context) return;

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const grayscale = new Float32Array(width * height);

    // Convert to grayscale
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      // If transparent, treat as white (255)
      grayscale[i / 4] = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Apply Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldPixel = grayscale[idx];
        const newPixel = oldPixel < 128 ? 0 : 255;
        grayscale[idx] = newPixel;
        const error = oldPixel - newPixel;

        if (x + 1 < width) grayscale[idx + 1] += error * 7 / 16;
        if (y + 1 < height) {
          if (x - 1 >= 0) grayscale[idx + width - 1] += error * 3 / 16;
          grayscale[idx + width] += error * 5 / 16;
          if (x + 1 < width) grayscale[idx + width + 1] += error * 1 / 16;
        }
      }
    }

    const header: number[] = [
      0x0A, // LF to ensure we are at the start of a line
      0x1D, 0x76, 0x30, 0x01, // GS v 0 with mode 1 (double density)
      widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
      height & 0xFF, (height >> 8) & 0xFF
    ];

    const imageDataBytes: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < widthBytes; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const px = x * 8 + bit;
          if (px < width && grayscale[y * width + px] === 0) {
            byte |= (1 << (7 - bit));
          }
        }
        imageDataBytes.push(byte);
      }
    }

    // Send header first
    await this.printRaw(new Uint8Array(header));

    // Send image data in chunks to avoid buffer overflow
    const CHUNK_SIZE = 512;
    for (let i = 0; i < imageDataBytes.length; i += CHUNK_SIZE) {
      await this.printRaw(new Uint8Array(imageDataBytes.slice(i, i + CHUNK_SIZE)));
    }
  }

  public static async printTextLine(text: string, width: number, options: any = {}) {
    if (this.containsBangla(text)) {
      const canvas = await this.renderTextToCanvas(text, width, options);
      await this.printCanvas(canvas);
    } else {
      const encoder = new TextEncoder();
      let commands: number[] = [];
      
      if (options.align === 'center') commands.push(...this.COMMANDS.ALIGN_CENTER);
      else if (options.align === 'right') commands.push(...this.COMMANDS.ALIGN_RIGHT);
      else commands.push(...this.COMMANDS.ALIGN_LEFT);

      if (options.bold) commands.push(...this.COMMANDS.BOLD_ON);
      if (options.doubleSize) commands.push(...this.COMMANDS.DOUBLE_SIZE_ON);

      commands.push(...Array.from(encoder.encode(text + '\n')));

      if (options.doubleSize) commands.push(...this.COMMANDS.SIZE_NORMAL);
      if (options.bold) commands.push(...this.COMMANDS.BOLD_OFF);
      
      await this.printRaw(new Uint8Array(commands));
    }
  }

  static async connect(deviceId?: string): Promise<{ success: boolean; device?: any }> {
    try {
      // 1. Check if already connected in memory
      if (this.characteristic && this.device?.gatt?.connected) {
        try {
          return { success: true, device: this.device };
        } catch (e) {
          this.characteristic = null;
        }
      }

      // 2. If deviceId is provided, try to reconnect without showing the picker
      if (deviceId && (navigator as any).bluetooth.getDevices) {
        try {
          const devices = await (navigator as any).bluetooth.getDevices();
          const existingDevice = devices.find((d: any) => d.id === deviceId);
          
          if (existingDevice) {
            this.device = existingDevice;
            this.server = await this.device.gatt.connect();
            
            const services = await this.server.getPrimaryServices();
            for (const service of services) {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  this.characteristic = char;
                  return { success: true, device: this.device };
                }
              }
            }
          }
        } catch (err) {
          console.warn('Silent reconnection failed:', err);
        }
      }

      // 3. Show the browser's device picker
      const options: any = {
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '00004953-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7e11001-49d2-4d03-8058-20a4003b90c5',
          0xFF00, 0x4953, 0x18f0, 0x18f1, 0x1101
        ]
      };

      this.device = await (navigator as any).bluetooth.requestDevice(options);
      this.server = await this.device.gatt.connect();
      
      const services = await this.server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            return { success: true, device: this.device };
          }
        }
      }
      
      throw new Error('No writable characteristic found.');
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return { success: false };
    }
  }

  static async disconnect() {
    try {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }
    } catch (error) {
      console.error('Bluetooth disconnect failed:', error);
    } finally {
      this.device = null;
      this.server = null;
      this.characteristic = null;
    }
    return true;
  }

  static async printRaw(data: Uint8Array) {
    if (!this.characteristic) throw new Error('Printer not connected');
    
    // Increased chunk size for faster printing. 
    // Most modern Bluetooth thermal printers can handle 512 or even 1024 bytes.
    const chunkSize = 512; 
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      try {
        // writeValueWithoutResponse is significantly faster than writeValueWithResponse
        if (this.characteristic.writeValueWithoutResponse && this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
          // Very small delay to prevent buffer overflow on the printer side
          await new Promise(resolve => setTimeout(resolve, 1));
        } else if (this.characteristic.writeValueWithResponse && this.characteristic.properties.write) {
          await this.characteristic.writeValueWithResponse(chunk);
          // No delay needed for writeWithResponse as it waits for acknowledgement
        } else {
          // Fallback for older browsers/devices
          await this.characteristic.writeValue(chunk);
          await new Promise(resolve => setTimeout(resolve, 2));
        }
      } catch (error) {
        console.error('Chunk write failed:', error);
        // Final fallback attempt
        try {
          await this.characteristic.writeValue(chunk);
          await new Promise(resolve => setTimeout(resolve, 5));
        } catch (innerError) {
          throw new Error('Failed to write to printer characteristic');
        }
      }
    }
  }

  static async printElement(element: HTMLElement, paperWidth: string = '80mm') {
    const pixelWidth = paperWidth === '58mm' ? 384 : 576;
    
    // Create a temporary container to fix the width for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${pixelWidth}px`;
    container.style.backgroundColor = 'white';
    
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.margin = '0';
    clone.style.padding = '10px'; // Add some padding for better look
    clone.style.boxSizing = 'border-box';
    clone.style.display = 'block'; // Ensure it's visible for capture
    clone.classList.remove('hidden'); // Remove tailwind hidden if present
    
    container.appendChild(clone);
    document.body.appendChild(container);
    
    try {
      // Small delay to ensure any rendering/animations are finished
      await new Promise(resolve => setTimeout(resolve, 500));
      await document.fonts.ready;
      
      const canvas = await html2canvas(clone, {
        width: pixelWidth,
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      await this.printRaw(new Uint8Array(this.COMMANDS.INIT));
      await this.printCanvas(canvas);
      await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
    } finally {
      document.body.removeChild(container);
    }
  }

  static async printInvoice(business: Business, order: Order, transaction?: any, elementId: string = 'invoice-content') {
    // We prefer text-based printing because it's much more reliable on thermal printers
    // and handles Bangla correctly by rendering only text lines to canvas when needed.
    
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    
    await this.printRaw(new Uint8Array(this.COMMANDS.INIT));

    // Header
    await this.printTextLine(business.name, pixelWidth, { align: 'center', doubleSize: true, bold: true });
    
    if (business.printerSettings?.receiptHeader) {
      await this.printTextLine(business.printerSettings.receiptHeader, pixelWidth, { align: 'center' });
    } else {
      await this.printTextLine(business.address, pixelWidth, { align: 'center' });
      await this.printTextLine('Tel: ' + business.phone, pixelWidth, { align: 'center' });
    }
    
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Order Info
    await this.printTextLine(`Token: #${order.tokenNumber}`, pixelWidth, { align: 'left', bold: true });
    await this.printTextLine(`Date: ${new Date(order.createdAt).toLocaleString()}`, pixelWidth, { align: 'left' });
    if (order.tableNumber) {
      await this.printTextLine(`Table: ${order.tableNumber}`, pixelWidth, { align: 'left' });
    }
    
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Items
    for (const item of order.items) {
      const qty = `x${item.quantity}`;
      const price = (item.price * item.quantity).toFixed(2);
      
      if (this.containsBangla(item.name)) {
        // For Bangla, we render the whole line to canvas to ensure alignment
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = pixelWidth * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const fontSize = 32 * scale;
          const fontString = `bold ${fontSize}px "Inter", "Hind Siliguri", sans-serif`;
          
          try {
            await document.fonts.load(fontString);
          } catch (e) {
            console.warn('Font loading failed:', e);
          }
          
          ctx.font = fontString;
          ctx.scale(scale, scale);
          canvas.height = (fontSize + 10) * scale;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'top';
          
          // Draw Name + Qty on left
          ctx.fillText(`${item.name} ${qty}`, 0, 0);
          
          // Draw Price on right
          ctx.textAlign = 'right';
          ctx.fillText(price, pixelWidth, 0);
          
          await this.printCanvas(canvas);
        }
      } else {
        // For standard text, use padding for speed
        const priceStr = price;
        const qtyStr = qty;
        const nameStr = item.name;
        
        // Calculate how many spaces we can fit
        // Line format: "Name xQty         Price"
        // We want Price to be right-aligned
        const leftPart = `${nameStr} ${qtyStr}`;
        const rightPart = priceStr;
        
        const spacesNeeded = width - leftPart.length - rightPart.length;
        
        let line = '';
        if (spacesNeeded > 0) {
          line = leftPart + ' '.repeat(spacesNeeded) + rightPart + '\n';
        } else {
          // If name is too long, wrap it or truncate
          const truncatedName = nameStr.substring(0, width - qtyStr.length - rightPart.length - 3);
          line = `${truncatedName} ${qtyStr} ${rightPart}\n`;
        }
        
        await this.printRaw(new Uint8Array(new TextEncoder().encode(line)));
      }
    }

    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Totals
    const subtotal = order.totalAmount;
    const vat = business.includeVat ? (subtotal * (business.vatRate / 100)) : 0;
    const discount = transaction?.discount || order.discount || 0;
    const total = subtotal + vat - discount;

    await this.printTextLine(`Subtotal: ${business.currency}${subtotal.toFixed(2)}`, pixelWidth, { align: 'right' });
    if (business.includeVat) {
      await this.printTextLine(`VAT (${business.vatRate}%): ${business.currency}${vat.toFixed(2)}`, pixelWidth, { align: 'right' });
    }
    if (discount > 0) {
      await this.printTextLine(`Discount: -${business.currency}${discount.toFixed(2)}`, pixelWidth, { align: 'right' });
    }
    await this.printTextLine(`TOTAL: ${business.currency}${total.toFixed(2)}`, pixelWidth, { align: 'right', bold: true });

    // Footer
    await this.printRaw(new Uint8Array([0x0A])); // LF
    if (business.printerSettings?.receiptFooter) {
      await this.printTextLine(business.printerSettings.receiptFooter, pixelWidth, { align: 'center' });
    } else {
      await this.printTextLine('Thank You! Come Again', pixelWidth, { align: 'center' });
    }
    
    await this.printTextLine('Powered by RestoKeep', pixelWidth, { align: 'center', fontSize: 18 });
    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
  }

  static async printKOT(business: Business, order: Order | any, elementId: string = 'kot-content') {
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    
    await this.printRaw(new Uint8Array(this.COMMANDS.INIT));

    await this.printTextLine('KITCHEN TICKET', pixelWidth, { align: 'center', doubleSize: true, bold: true });
    await this.printTextLine(`Token: #${order.tokenNumber}`, pixelWidth, { align: 'center' });
    await this.printTextLine(`Table: ${order.tableNumber || 'Delivery'}`, pixelWidth, { align: 'center' });
    await this.printTextLine(new Date().toLocaleString(), pixelWidth, { align: 'center' });
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    for (const item of order.items) {
      await this.printTextLine(`x${item.quantity} ${item.name}`, pixelWidth, { align: 'left', bold: true });
    }

    if (order.note) {
      await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));
      await this.printTextLine(`NOTE: ${order.note}`, pixelWidth, { align: 'left' });
    }

    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
  }
}
