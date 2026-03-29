
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
    canvas.width = width;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const fontSize = options.fontSize || 24;
    const fontName = '"Inter", "Arial", sans-serif';
    ctx.font = `${options.bold ? 'bold ' : ''}${fontSize}px ${fontName}`;

    const lines = text.split('\n');
    canvas.height = lines.length * (fontSize + 8);

    // Fill background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = 'black';
    ctx.font = `${options.bold ? 'bold ' : ''}${fontSize}px ${fontName}`;
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

  private static async renderLineToCanvas(leftText: string, rightText: string, width: number, options: any = {}): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const leftFontSize = options.leftFontSize || 24;
    const rightFontSize = options.rightFontSize || 24;
    const fontName = '"Inter", "Arial", sans-serif';

    // Set canvas height based on the larger font
    canvas.height = Math.max(leftFontSize, rightFontSize) + 8;

    // Fill background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textBaseline = 'top';

    // Draw right text first to know how much space is left
    ctx.font = `${options.bold ? 'bold ' : ''}${rightFontSize}px ${fontName}`;
    ctx.fillStyle = 'black';
    const rightWidth = ctx.measureText(rightText).width;
    ctx.fillText(rightText, width - rightWidth, 0);

    // Draw left text, truncating if necessary to avoid overlap
    ctx.font = `${options.bold ? 'bold ' : ''}${leftFontSize}px ${fontName}`;
    const availableWidthForLeft = width - rightWidth - 10; // 10px margin
    let finalLeftText = leftText;
    
    if (ctx.measureText(finalLeftText).width > availableWidthForLeft) {
        let truncated = finalLeftText;
        while (ctx.measureText(truncated + '...').width > availableWidthForLeft && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        finalLeftText = truncated + '...';
    }
    
    ctx.fillText(finalLeftText, 0, 0);

    return canvas;
  }

  private static async printBanglaItemLine(name: string, qty: string, price: string, width: number) {
    const canvas = await this.renderLineToCanvas(`${name} ${qty}`, price, width, { leftFontSize: 32, rightFontSize: 24 });
    await this.printCanvas(canvas);
  }

  private static async printCanvas(canvas: HTMLCanvasElement) {
    const width = canvas.width;
    const height = canvas.height;
    const widthBytes = Math.ceil(width / 8);
    
    const context = canvas.getContext('2d');
    if (!context) return;

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    const data: number[] = [
      ...this.COMMANDS.GS_V_0,
      widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
      height & 0xFF, (height >> 8) & 0xFF
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < widthBytes; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const px = x * 8 + bit;
          if (px < width) {
            const idx = (y * width + px) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];
            
            // Threshold for black/white
            const brightness = (r + g + b) / 3;
            if (a > 128 && brightness < 128) {
              byte |= (1 << (7 - bit));
            }
          }
        }
        data.push(byte);
      }
    }

    await this.printRaw(new Uint8Array(data));
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

  static async connect(deviceId?: string): Promise<{ success: boolean; device?: any; error?: 'cancelled' | 'failed' }> {
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
    } catch (error: any) {
      if (error.name === 'NotFoundError' || error.name === 'NotAllowedError' || error.message.includes('cancelled')) {
        console.warn('Bluetooth connection cancelled by user.');
        return { success: false, error: 'cancelled' };
      }
      console.error('Bluetooth connection failed:', error);
      return { success: false, error: 'failed' };
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
    
    // Use a larger chunk size for better performance
    const chunkSize = 512; 
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      try {
        // Try newer methods first, fallback to deprecated writeValue for older browsers
        if (this.characteristic.writeValueWithResponse) {
          if (this.characteristic.properties.write) {
            await this.characteristic.writeValueWithResponse(chunk);
          } else {
            await this.characteristic.writeValueWithoutResponse(chunk);
          }
        } else {
          await this.characteristic.writeValue(chunk);
        }
        // Reduced delay to prevent buffer overflow on slower printer controllers
        await new Promise(resolve => setTimeout(resolve, 2));
      } catch (error) {
        console.error('Chunk write failed:', error);
        // Final attempt with writeValue if other methods failed
        try {
          await this.characteristic.writeValue(chunk);
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
      
      const canvas = await html2canvas(clone, {
        width: pixelWidth,
        scale: 1,
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
      const qty = `${item.quantity} x`;
      const price = (item.price * item.quantity).toFixed(2);
      const name = item.name;
      
      const canvas = await this.renderLineToCanvas(`${qty} ${name}`, price, pixelWidth, { leftFontSize: 32, rightFontSize: 24 });
      await this.printCanvas(canvas);
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
    
    await this.printTextLine('Powered by: RestoKeep', pixelWidth, { align: 'center', fontSize: 18 });
    await this.printTextLine('www.restokeep.app', pixelWidth, { align: 'center', fontSize: 14 });
    await this.printTextLine('Mob: 01303565316', pixelWidth, { align: 'center', fontSize: 14 });
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
      await this.printTextLine(`${item.quantity} x ${item.name}`, pixelWidth, { align: 'left', bold: true });
    }

    if (order.note) {
      await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));
      await this.printTextLine(`NOTE: ${order.note}`, pixelWidth, { align: 'left' });
    }

    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
  }
}
