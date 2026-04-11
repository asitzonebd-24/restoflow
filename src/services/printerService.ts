
export class BluetoothPrinterService {
  private static device: any = null;
  private static server: any = null;
  private static characteristic: any = null;

  static async connect(deviceId?: string): Promise<{ success: boolean; device?: any; error?: string }> {
    try {
      if (this.device && this.device.gatt.connected) {
        return { success: true, device: { name: this.device.name, id: this.device.id } };
      }

      const options: any = {
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      };

      // If we have a deviceId, we might be able to reconnect, but Web Bluetooth usually requires user gesture
      // and doesn't support reconnecting by ID without a previous successful connection in the same session.
      // For simplicity, we'll always request a new device if not connected.
      
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristics = await service.getCharacteristics();
      this.characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

      return { 
        success: true, 
        device: { 
          name: this.device.name, 
          id: this.device.id 
        } 
      };
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return { success: false, error: 'failed' };
    }
  }

  static async disconnect(): Promise<void> {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  static async printRaw(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    // Split data into chunks of 20 bytes (standard BLE MTU limit)
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }
  }

  static async printKOT(business: any, order: any): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    
    await this.printTextLine('KITCHEN ORDER TICKET', pixelWidth, { align: 'center', bold: true, doubleSize: true });
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    await this.printTextLine(`Token: ${order.tokenNumber}`, pixelWidth, { align: 'center', bold: true, doubleSize: true });
    await this.printTextLine(`Table: ${order.tableNumber}`, pixelWidth, { align: 'center', bold: true });
    await this.printTextLine(`Waiter: ${order.creatorName || 'Staff'}`, pixelWidth, { align: 'center' });
    await this.printTextLine(`Date: ${new Date(order.createdAt).toLocaleString()}`, pixelWidth, { align: 'center' });
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    
    for (const item of order.items) {
      const itemLine = `${item.quantity}x ${item.name}`;
      await this.printTextLine(itemLine, pixelWidth, { bold: true });
      if (item.note) {
        await this.printTextLine(`  Note: ${item.note}`, pixelWidth);
      }
    }
    
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    if (order.note) {
      await this.printTextLine(`Order Note: ${order.note}`, pixelWidth);
    }
    
    // Feed and cut
    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), 0x1D, 0x56, 0x41, 0x03]));
  }

  static async printInvoice(business: any, order: any, options: { discount?: number; creatorName: string }): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
    const currency = business.currency || '$';
    const discount = options.discount || 0;
    
    // Header
    await this.printTextLine(business.name, pixelWidth, { align: 'center', bold: true, doubleSize: true });
    if (business.address) await this.printTextLine(business.address, pixelWidth, { align: 'center' });
    if (business.phone) await this.printTextLine(`Phone: ${business.phone}`, pixelWidth, { align: 'center' });
    if (business.printerSettings?.receiptHeader) {
      await this.printTextLine(business.printerSettings.receiptHeader, pixelWidth, { align: 'center' });
    }
    
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    await this.printTextLine(`INVOICE #${order.tokenNumber}`, pixelWidth, { align: 'center', bold: true });
    await this.printTextLine(`Date: ${new Date().toLocaleString()}`, pixelWidth);
    await this.printTextLine(`Staff: ${options.creatorName}`, pixelWidth);
    await this.printTextLine(`Table: ${order.tableNumber}`, pixelWidth);
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    
    let subtotal = 0;
    for (const item of order.items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      await this.printTextLine(`${item.name}`, pixelWidth, { bold: true });
      await this.printTextLine(`${item.quantity} x ${currency}${item.price.toFixed(2)} = ${currency}${itemTotal.toFixed(2)}`, pixelWidth, { align: 'right' });
    }
    
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    
    await this.printTextLine(`Subtotal: ${currency}${subtotal.toFixed(2)}`, pixelWidth, { align: 'right' });
    
    if (discount > 0) {
      await this.printTextLine(`Discount: -${currency}${discount.toFixed(2)}`, pixelWidth, { align: 'right' });
    }
    
    const vat = business.includeVat ? (subtotal - discount) * (business.vatRate / 100) : 0;
    if (vat > 0) {
      await this.printTextLine(`VAT (${business.vatRate}%): ${currency}${vat.toFixed(2)}`, pixelWidth, { align: 'right' });
    }
    
    const total = subtotal - discount + (business.includeVat ? vat : 0);
    await this.printTextLine(`TOTAL: ${currency}${total.toFixed(2)}`, pixelWidth, { align: 'right', bold: true, doubleSize: true });
    
    await this.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
    
    if (business.printerSettings?.receiptFooter) {
      await this.printTextLine(business.printerSettings.receiptFooter, pixelWidth, { align: 'center' });
    }
    await this.printTextLine('Thank you for your visit!', pixelWidth, { align: 'center' });
    
    // Feed and cut
    await this.printRaw(new Uint8Array([...Array(4).fill(0x0A), 0x1D, 0x56, 0x41, 0x03]));
  }

  static async printTextLine(
    text: string, 
    pixelWidth: number, 
    options: { align?: 'left' | 'center' | 'right'; doubleSize?: boolean; bold?: boolean } = {}
  ): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    const encoder = new TextEncoder();
    let commands: number[] = [];

    // Reset/Initialize
    commands.push(0x1B, 0x40);

    // Alignment
    if (options.align === 'center') {
      commands.push(0x1B, 0x61, 0x01);
    } else if (options.align === 'right') {
      commands.push(0x1B, 0x61, 0x02);
    } else {
      commands.push(0x1B, 0x61, 0x00);
    }

    // Bold
    if (options.bold) {
      commands.push(0x1B, 0x45, 0x01);
    } else {
      commands.push(0x1B, 0x45, 0x00);
    }

    // Double Size
    if (options.doubleSize) {
      commands.push(0x1D, 0x21, 0x11); // Double width and height
    } else {
      commands.push(0x1D, 0x21, 0x00);
    }

    // Text data
    const textData = encoder.encode(text + '\n');
    commands.push(...Array.from(textData));

    await this.printRaw(new Uint8Array(commands));
  }
}
