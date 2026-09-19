import { BasePublisher, PublishRequest, PublishResponse } from './types';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { stealth } from 'playwright-stealth';
import { db } from '@/lib/database';
import { decrypt } from '@/lib/encryption';

export abstract class PlaywrightPublisher implements BasePublisher {
  abstract platformName: string;
  abstract loginUrl: string;

  protected async getContext(traceId: string): Promise<{ browser: Browser, context: BrowserContext }> {
    const browser = await chromium.launch({ 
      headless: process.env.NODE_ENV === 'production',
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    // 1. Fetch encrypted session from DB
    const { data: creds } = await db.from('platform_credentials')
      .select('auth_payload')
      .eq('platform_name', this.platformName)
      .single();

    if (!creds?.auth_payload) {
      throw new Error(`No credentials found for ${this.platformName}`);
    }

    // 2. Decrypt session
    const decryptedPayload = await decrypt(creds.auth_payload, process.env.ENCRYPTION_KEY!);
    
    let storageState;
    try {
      storageState = JSON.parse(decryptedPayload);
    } catch (e: any) {
      console.error(`[PlaywrightPublisher] Failed to parse decrypted payload for ${this.platformName}. Length: ${decryptedPayload.length}. Preview: ${decryptedPayload.substring(0, 50)}`);
      throw new Error(`Session data for ${this.platformName} is corrupted or invalid. Please reconnect via the Admin panel.`);
    }

    // 3. Create context with state and apply stealth
    const context = await browser.newContext({ 
      storageState,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // Actually apply the stealth init script to the context
    await context.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // @ts-ignore
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      // @ts-ignore
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
      // @ts-ignore
      window.chrome = { runtime: {} };
      try {
        const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
        if (typeof originalQuery === 'function') {
          window.navigator.permissions.query = (parameters: any) => (
            parameters && parameters.name === 'notifications'
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery.call(window.navigator.permissions, parameters)
          );
        }
      } catch (e) {}
    });
    
    return { browser, context };
  }

  abstract publish(request: PublishRequest): Promise<PublishResponse>;
  
  async validateSession(): Promise<boolean> {
    // Basic validation logic
    return true; 
  }
}
