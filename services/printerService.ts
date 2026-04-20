
import html2canvas from 'html2canvas';
import { Business, Order, OrderItem, OrderStatus } from '../types';

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

  static async connect(deviceId?: string): Promise<{ success: boolean; device?: any; error?: 'cancelled' | 'failed' | 'unsupported' }> {
    try {
      // 0. Check if Bluetooth is supported and allowed
      if (!navigator || !(navigator as any).bluetooth) {
        console.warn('Bluetooth is not supported in this browser or environment.');
        return { success: false, error: 'unsupported' };
      }

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
      if (error.name === 'SecurityError' || error.message.includes('disallowed by permissions policy')) {
        console.warn('Bluetooth access is blocked by permissions policy.');
        return { success: false, error: 'unsupported' };
      }
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

  private static groupItems(items: OrderItem[]): OrderItem[] {
    const grouped = items.reduce((acc, item) => {
      if (item.status === OrderStatus.CANCELLED) return acc;
      const existing = acc.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  }

  static async printInvoice(business: Business, order: Order, transaction?: any, elementId: string = 'invoice-content') {
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    const currency = business.currency || 'Tk';
    
    await this.printRaw(new Uint8Array(this.COMMANDS.INIT));

    // Header
    await this.printTextLine(business.name, pixelWidth, { align: 'center', doubleSize: true, bold: true });
    await this.printTextLine(business.address || '', pixelWidth, { align: 'center' });
    if (business.phone) await this.printTextLine(`Mob: ${business.phone}`, pixelWidth, { align: 'center' });
    
    await this.printRaw(new Uint8Array([0x0A])); // LF
    await this.printTextLine('INVOICE', pixelWidth, { align: 'center', bold: true, doubleSize: true });
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Order Info
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB');
    const timeStr = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    await this.printTextLine(`Token: #${order.tokenNumber}`, pixelWidth, { align: 'left', bold: true });
    await this.printTextLine(`Table: ${order.tableNumber || 'N/A'}`, pixelWidth, { align: 'left' });
    
    const dateTimeCanvas = await this.renderLineToCanvas(`Date: ${dateStr}`, `Time: ${timeStr}`, pixelWidth, { leftFontSize: 24, rightFontSize: 24 });
    await this.printCanvas(dateTimeCanvas);
    
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Items
    const groupedItems = this.groupItems(order.items);
    for (const item of groupedItems) {
      const qty = `${item.quantity} x ${item.name}`;
      const price = `${currency}${(item.price * item.quantity).toFixed(0)}`;
      const canvas = await this.renderLineToCanvas(qty, price, pixelWidth, { leftFontSize: 28, rightFontSize: 28 });
      await this.printCanvas(canvas);
    }

    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    // Totals
    const subtotal = order.totalAmount;
    const vat = business.includeVat ? (subtotal * (business.vatRate / 100)) : 0;
    const discount = transaction?.discount || order.discount || 0;
    const total = subtotal + vat - discount;

    const totalsCanvas = async (label: string, value: string, bold: boolean = false) => {
        const c = await this.renderLineToCanvas(label, value, pixelWidth, { leftFontSize: 24, rightFontSize: bold ? 32 : 24, bold });
        await this.printCanvas(c);
    };

    await totalsCanvas('Subtotal', `${currency}${subtotal.toFixed(2)}`);
    if (business.includeVat) await totalsCanvas(`VAT (${business.vatRate}%)`, `${currency}${vat.toFixed(2)}`);
    if (discount > 0) await totalsCanvas('Discount', `-${currency}${discount.toFixed(2)}`);
    await totalsCanvas('TOTAL', `${currency}${total.toFixed(2)}`, true);

    // Footer
    await this.printRaw(new Uint8Array([0x0A, 0x0A]));
    await this.printTextLine('Thank you for dining with us!', pixelWidth, { align: 'center' });
    await this.printTextLine('Please visit again.', pixelWidth, { align: 'center' });
    
    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
  }

  static async printKOT(business: Business, order: Order | any, elementId: string = 'kot-content') {
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    
    await this.printRaw(new Uint8Array(this.COMMANDS.INIT));

    await this.printTextLine(`Kitchen Token: #${order.tokenNumber}`, pixelWidth, { align: 'center', bold: true, doubleSize: true });
    await this.printTextLine(`Table No: ${order.tableNumber || 'Delivery'}`, pixelWidth, { align: 'center', bold: true, doubleSize: true });
    if (order.creatorName) {
      await this.printTextLine(`Ordered by: ${order.creatorName}`, pixelWidth, { align: 'center', bold: true, doubleSize: true });
    }
    
    const dateStr = new Date().toLocaleDateString('en-GB');
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const dateTimeCanvas = await this.renderLineToCanvas(`Date: ${dateStr}`, `Time: ${timeStr}`, pixelWidth, { leftFontSize: 24, rightFontSize: 24, bold: true });
    await this.printCanvas(dateTimeCanvas);
    
    await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));

    const groupedItems = this.groupItems(order.items);
    for (const item of groupedItems) {
      await this.printTextLine(`${item.quantity} x ${item.name}`, pixelWidth, { align: 'left', bold: true, doubleSize: true });
    }

    if (order.note) {
      await this.printRaw(new Uint8Array(new TextEncoder().encode('-'.repeat(width) + '\n')));
      await this.printTextLine(`NOTE: ${order.note}`, pixelWidth, { align: 'left', bold: true, doubleSize: true });
    }

    await this.printRaw(new Uint8Array([0x0A]));
    await this.printTextLine('--- Kitchen Copy ---', pixelWidth, { align: 'center', bold: true });
    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), ...this.COMMANDS.CUT]));
  }
}
