'use server';

import { chromium } from 'playwright';
import { db } from '@/lib/database';
import { encrypt, decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

const CONST_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function launchLoginAction(platformName: string, loginUrl: string) {
  const traceId = crypto.randomUUID();
  console.log(`[${traceId}] Starting login capture for ${platformName}...`);
  
  try {
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({ userAgent: CONST_UA });
    
    // Apply stealth for login capture
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

    const page = await context.newPage();
    
    await page.goto(loginUrl);
    
    console.log(`[${traceId}] Browser open. Monitoring for successful login...`);

    // Define platform-specific success indicators
    const isSuccess = (url: string) => {
      const urlLower = url.toLowerCase();
      if (platformName === 'tiktok') return urlLower.includes('tiktok.com') && !urlLower.includes('/login');
      if (platformName === 'douyin') return urlLower.includes('creator.douyin.com') && !urlLower.includes('/login');
      if (platformName === 'rednote' || platformName === 'xiaohongshu') return urlLower.includes('creator.rednote.com') && !urlLower.includes('/login');
      return false;
    };

    // Wait for either the success URL OR manual window close
    const result = await Promise.race([
      // Success Detection
      new Promise((resolve) => {
        page.on('framenavigated', async (frame) => {
          const url = frame.url();
          if (isSuccess(url)) {
            console.log(`[${traceId}] Success URL detected: ${url}`);
            // Give it a second to settle cookies
            await new Promise(r => setTimeout(r, 2000));
            resolve('SUCCESS');
          }
        });
      }),
      // Manual/Timeout Fallback
      new Promise((resolve) => {
        page.on('close', () => resolve('CLOSED'));
        browser.on('disconnected', () => resolve('DISCONNECTED'));
        setTimeout(() => resolve('TIMEOUT'), 180000); // 3 min max
      })
    ]);

    console.log(`[${traceId}] Capture trigger: ${result}`);

    if (result === 'TIMEOUT') {
      await browser.close().catch(() => {});
      return { success: false, error: 'Login timed out after 3 minutes.' };
    }

    if (result === 'CLOSED' || result === 'DISCONNECTED') {
       return { success: false, error: 'Browser was closed manually before successful login was detected.' };
    }

    // Capture state
    const storageState = await context.storageState();
    const serializedState = JSON.stringify(storageState);
    
    // Encrypt and save
    const encryptedPayload = await encrypt(serializedState, process.env.ENCRYPTION_KEY!);
    
    await db.upsert('platform_credentials', {
      platform_name: platformName,
      auth_payload: encryptedPayload,
      is_active: true,
      updated_at: new Date().toISOString()
    }, traceId, 'platform_name');

    await browser.close();
    revalidatePath('/admin/platforms');
    return { success: true };
  } catch (error: any) {
    console.error(`[${traceId}] Login failed for ${platformName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function captureExistingSessionAction(platformName: string) {
  // This is a placeholder for a future feature where we might 
  // connect to an already open browser. For now, we rely on the 
  // improved auto-detection in launchLoginAction.
  return { success: false, error: "Not implemented yet. Please use 'Connect / Refresh'." };
}

export async function getPlatformStatuses() {
  try {
    const { data: creds, error } = await db.from('platform_credentials')
      .select('platform_name, is_active, updated_at');
    
    if (error) throw error;
    
    return { success: true, platforms: creds || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function validatePlatformSessionAction(platformName: string) {
  const traceId = crypto.randomUUID();
  console.log(`[${traceId}] Validating session for ${platformName}...`);

  let browser;
  try {
    const { data: creds } = await db.from('platform_credentials')
      .select('auth_payload')
      .eq('platform_name', platformName)
      .single();

    if (!creds?.auth_payload) throw new Error("No session found");

    const decryptedPayload = await decrypt(creds.auth_payload, process.env.ENCRYPTION_KEY!);
    
    let storageState;
    try {
      storageState = JSON.parse(decryptedPayload);
    } catch (e: any) {
      console.error(`[${traceId}] Failed to parse decrypted payload for ${platformName}. Length: ${decryptedPayload.length}. Preview: ${decryptedPayload.substring(0, 50)}`);
      throw new Error(`Session data is corrupted or invalid. Please reconnect ${platformName}.`);
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState });
    
    // Apply stealth for validation
    await context.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();

    let isValid = false;
    
    // Use shorter timeout and faster wait strategy
    const fastGoTo = async (url: string) => {
      console.log(`[${traceId}] Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Short wait for any immediate redirects
      await page.waitForTimeout(2000);
    };

    if (platformName === 'tiktok') {
      await fastGoTo('https://www.tiktok.com/creator-center');
      isValid = !page.url().includes('login');
    } else if (platformName === 'douyin') {
      await fastGoTo('https://creator.douyin.com/creator-micro/home');
      isValid = !page.url().includes('login');
    } else if (platformName === 'rednote') {
      await fastGoTo('https://creator.rednote.com/creator/home');
      isValid = !page.url().includes('login');
    } else {
      isValid = true; 
    }

    console.log(`[${traceId}] Validation result for ${platformName}: ${isValid ? 'VALID' : 'INVALID'}. Current URL: ${page.url()}`);

    // Update status in DB
    await db.update('platform_credentials', { 
      is_active: isValid,
      updated_at: new Date().toISOString()
    }, { platform_name: platformName }, traceId);

    revalidatePath('/admin/platforms');
    return { success: true, isValid };
  } catch (error: any) {
    console.error(`[${traceId}] Validation failed for ${platformName}:`, error);
    return { success: false, error: error.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
