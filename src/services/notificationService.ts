
export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static async notify(title: string, body: string, icon?: string): Promise<void> {
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          (registration as any).showNotification(title, {
            body,
            icon: icon || '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'restokeep-notification',
            renotify: true
          });
        } else {
          new Notification(title, {
            body,
            icon: icon || '/logo.png'
          });
        }
      } catch (error) {
        // Fallback if service worker is not ready
        new Notification(title, {
          body,
          icon: icon || '/logo.png'
        });
      }
    } else {
      console.log('Notification permission not granted');
    }
  }

  static async notifyOrderReady(tokenNumber: string): Promise<void> {
    await this.notify(
      'Order Ready! 🍽️',
      `Your order #${tokenNumber} is ready for pickup or delivery. Enjoy your meal!`,
      '/ready-icon.png'
    );
  }

  static async notifyPromotion(title: string, message: string): Promise<void> {
    await this.notify(
      `Special Offer: ${title} ✨`,
      message,
      '/promo-icon.png'
    );
  }
}
