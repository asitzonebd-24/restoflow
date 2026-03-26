
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
  };

  static async connect(deviceId?: string): Promise<boolean> {
    try {
      if (this.characteristic && this.device?.gatt?.connected) {
        return true;
      }

      const options: any = {
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic
          0xFF00, 0x4953 // Common thermal printer services
        ]
      };

      this.device = await (navigator as any).bluetooth.requestDevice(options);
      this.server = await this.device.gatt.connect();
      
      // Try to find a writable characteristic
      const services = await this.server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            return true;
          }
        }
      }
      
      throw new Error('No writable characteristic found on this device.');
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  static async printRaw(data: Uint8Array) {
    if (!this.characteristic) throw new Error('Printer not connected');
    
    // Split into chunks if data is large (BLE limit is usually 20-512 bytes)
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }
  }

  static async printInvoice(business: Business, order: Order, transaction?: any) {
    const encoder = new TextEncoder();
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    
    let commands: number[] = [...this.COMMANDS.INIT];

    // Header
    commands.push(...this.COMMANDS.ALIGN_CENTER);
    if (business.printerSettings?.showLogo !== false) {
      // Logo printing is complex (bitmaps), skipping for now, using text name
    }
    commands.push(...this.COMMANDS.DOUBLE_SIZE_ON, ...Array.from(encoder.encode(business.name + '\n')), ...this.COMMANDS.SIZE_NORMAL);
    
    if (business.printerSettings?.receiptHeader) {
      commands.push(...Array.from(encoder.encode(business.printerSettings.receiptHeader + '\n')));
    } else {
      commands.push(...Array.from(encoder.encode(business.address + '\n')));
      commands.push(...Array.from(encoder.encode('Tel: ' + business.phone + '\n')));
    }
    
    commands.push(...Array.from(encoder.encode('-'.repeat(width) + '\n')));

    // Order Info
    commands.push(...this.COMMANDS.ALIGN_LEFT);
    commands.push(...Array.from(encoder.encode(`Token: #${order.tokenNumber}\n`)));
    commands.push(...Array.from(encoder.encode(`Date: ${new Date(order.createdAt).toLocaleString()}\n`)));
    if (order.tableNumber) commands.push(...Array.from(encoder.encode(`Table: ${order.tableNumber}\n`)));
    
    commands.push(...Array.from(encoder.encode('-'.repeat(width) + '\n')));

    // Items
    order.items.forEach(item => {
      const name = item.name.substring(0, width - 15);
      const qty = `x${item.quantity}`.padEnd(5);
      const price = (item.price * item.quantity).toFixed(2);
      const line = `${name.padEnd(width - 15)} ${qty} ${price.padStart(8)}\n`;
      commands.push(...Array.from(encoder.encode(line)));
    });

    commands.push(...Array.from(encoder.encode('-'.repeat(width) + '\n')));

    // Totals
    commands.push(...this.COMMANDS.ALIGN_RIGHT);
    const subtotal = order.totalAmount;
    const vat = business.includeVat ? (subtotal * (business.vatRate / 100)) : 0;
    const discount = transaction?.discount || order.discount || 0;
    const total = subtotal + vat - discount;

    commands.push(...Array.from(encoder.encode(`Subtotal: ${business.currency}${subtotal.toFixed(2)}\n`)));
    if (business.includeVat) {
      commands.push(...Array.from(encoder.encode(`VAT (${business.vatRate}%): ${business.currency}${vat.toFixed(2)}\n`)));
    }
    if (discount > 0) {
      commands.push(...Array.from(encoder.encode(`Discount: -${business.currency}${discount.toFixed(2)}\n`)));
    }
    commands.push(...this.COMMANDS.BOLD_ON);
    commands.push(...Array.from(encoder.encode(`TOTAL: ${business.currency}${total.toFixed(2)}\n`)));
    commands.push(...this.COMMANDS.BOLD_OFF);

    // Footer
    commands.push(...this.COMMANDS.ALIGN_CENTER);
    commands.push(...Array.from(encoder.encode('\n')));
    if (business.printerSettings?.receiptFooter) {
      commands.push(...Array.from(encoder.encode(business.printerSettings.receiptFooter + '\n')));
    } else {
      commands.push(...Array.from(encoder.encode('Thank You! Come Again\n')));
    }
    
    commands.push(...Array.from(encoder.encode('\nPowered by RestoKeep\n\n\n\n')));
    commands.push(...this.COMMANDS.CUT);

    await this.printRaw(new Uint8Array(commands));
  }

  static async printKOT(business: Business, order: Order | any) {
    const encoder = new TextEncoder();
    const width = business.printerSettings?.paperWidth === '58mm' ? 32 : 48;
    
    let commands: number[] = [...this.COMMANDS.INIT];

    commands.push(...this.COMMANDS.ALIGN_CENTER);
    commands.push(...this.COMMANDS.DOUBLE_SIZE_ON, ...Array.from(encoder.encode('KITCHEN TICKET\n')), ...this.COMMANDS.SIZE_NORMAL);
    commands.push(...Array.from(encoder.encode(`Token: #${order.tokenNumber}\n`)));
    commands.push(...Array.from(encoder.encode(`Table: ${order.tableNumber || 'Delivery'}\n`)));
    commands.push(...Array.from(encoder.encode(`${new Date().toLocaleString()}\n`)));
    commands.push(...Array.from(encoder.encode('-'.repeat(width) + '\n')));

    commands.push(...this.COMMANDS.ALIGN_LEFT);
    order.items.forEach((item: any) => {
      commands.push(...this.COMMANDS.BOLD_ON);
      commands.push(...Array.from(encoder.encode(`x${item.quantity} ${item.name}\n`)));
      commands.push(...this.COMMANDS.BOLD_OFF);
    });

    if (order.note) {
      commands.push(...Array.from(encoder.encode('-'.repeat(width) + '\n')));
      commands.push(...Array.from(encoder.encode(`NOTE: ${order.note}\n`)));
    }

    commands.push(...Array.from(encoder.encode('\n\n\n\n')));
    commands.push(...this.COMMANDS.CUT);

    await this.printRaw(new Uint8Array(commands));
  }
}
