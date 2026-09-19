import { PlaywrightPublisher } from './playwright-base';
import { PublishRequest, PublishResponse } from './types';
import { Page } from 'playwright';

export class RednotePublisher extends PlaywrightPublisher {
  platformName = 'rednote';
  loginUrl = 'https://creator.rednote.com/login';

  private async dismissPopups(page: Page) {
    // Rednote often has announcement or update modals
    const dismissSelectors = [
      'button:has-text("我知道了")',
      'button:has-text("确定")',
      'button:has-text("关闭")',
      '.xhs-modal-close',
      '.reds-modal-close',
      '.xhs-icon-close',
      '.reds-icon-close',
      '.close-icon',
      'svg.close-button',
      '.ant-modal-close'
    ];
    
    for (const selector of dismissSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible()) {
          console.log(`[Rednote] Dismissing popup with selector: ${selector}`);
          await btn.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } catch (e) {}
    }
  }

  private async captureDebugScreenshot(page: Page, name: string) {
    try {
      const path = `.temp/rednote-debug-${name}-${Date.now()}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`[Rednote] Debug screenshot saved to: ${path}`);
    } catch (e) {
      console.error(`[Rednote] Failed to capture screenshot:`, e.message);
    }
  }

  async publish(request: PublishRequest): Promise<PublishResponse> {
    const { browser, context } = await this.getContext(request.traceId);
    const page = await context.newPage();

    try {
      console.log(`[${request.traceId}] [Step 1] Establishing session via Home...`);
      const homeUrl = 'https://creator.rednote.com/creator/home';
      await page.goto(homeUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 45000 
      }).catch(e => console.log(`[${request.traceId}] Home load slow: ${e.message}`));
      
      await page.waitForTimeout(3000);
      await this.dismissPopups(page);

      const isVideo = request.mediaUrls.length > 0 && /\.(mp4|mov|avi|wmv|mkv|webm)$/i.test(request.mediaUrls[0]);
      const tabName = isVideo ? '上传视频' : '上传图文';
      
      console.log(`[${request.traceId}] [Step 2] Navigating to Publish Page (Mode: ${isVideo ? 'Video' : 'Image'})...`);
      
      // Use the appropriate URL parameter based on media type
      const publishUrl = isVideo 
        ? 'https://creator.rednote.com/publish/publish?from=menu&target=video' 
        : 'https://creator.rednote.com/publish/publish?from=menu';
        
      console.log(`[${request.traceId}] Target URL: ${publishUrl}`);
      
      await page.goto(publishUrl, { 
        waitUntil: 'commit', // Navigate as soon as the server responds
        timeout: 90000 
      });

      // Wait for the page content to actually appear manually
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
      console.log(`[${request.traceId}] Current URL after navigation: ${page.url()}`);

      await this.dismissPopups(page);
      await page.waitForTimeout(5000);

      // 0. Ensure correct tab is selected
      console.log(`[${request.traceId}] [Step 3] Switching to '${tabName}' mode...`);
      
      let modeClicked = false;
      const startTime = Date.now();
      const MAX_WAIT_MS = 30000;

      while (Date.now() - startTime < MAX_WAIT_MS) {
        await this.dismissPopups(page);
        
        // Target the div creator-tab directly based on media type
        const tabDiv = page.locator('div.creator-tab').filter({ hasText: tabName }).first();
        
        if (await tabDiv.isVisible()) {
          const diag = await tabDiv.evaluate((el) => {
            return {
              className: el.className,
              isActive: el.classList.contains('active')
            };
          }).catch(() => ({ isActive: false, className: 'unknown' }));

          console.log(`[${request.traceId}] Tab Status:`, JSON.stringify(diag));

          if (diag.isActive) {
            console.log(`[${request.traceId}] Mode '${tabName}' is ACTIVE.`);
            modeClicked = true;
            break;
          }

          console.log(`[${request.traceId}] Performing Native DOM click on '${tabName}' tab...`);
          try {
            // Force a native Javascript click directly on the element in the browser
            await tabDiv.evaluate((el: HTMLElement) => el.click());
            await page.waitForTimeout(1000);
            
            // Fallback: try clicking the span inside it natively
            const spanInside = await tabDiv.locator('span.title').first();
            if (await spanInside.isVisible()) {
              await spanInside.evaluate((el: HTMLElement) => el.click()).catch(()=>{});
            }
          } catch (e: any) {
            console.log(`[${request.traceId}] Click interaction failed: ${e.message}`);
          }
        } else {
          // If tab is not visible, check if we're already on the upload page
          console.log(`[${request.traceId}] Tab span not found yet... waiting.`);
        }

        await page.waitForTimeout(1500);
      }

      if (!modeClicked) {
        await this.captureDebugScreenshot(page, 'mode-selection-failed');
        throw new Error(`Failed to reach '${tabName}' mode.`);
      }

      // 1. Upload Media
      console.log(`[${request.traceId}] [Step 4] Uploading Media...`);
      
      const uploadInput = page.locator('input[type="file"]').first();
      await uploadInput.waitFor({ state: 'attached', timeout: 10000 });

      if (request.mediaUrls.length > 0) {
        console.log(`[${request.traceId}] Selecting ${request.mediaUrls.length} files...`);
        await uploadInput.setInputFiles(request.mediaUrls);
      } else {
        throw new Error("No media provided");
      }

      // 2. Wait for transition to editor
      console.log(`[${request.traceId}] [Step 5] Waiting for Editor transition...`);
      await page.waitForTimeout(5000);

      const nextBtnSelectors = ['button:has-text("下一步")', 'button:has-text("确定")', 'button:has-text("确认")'];

      for (let i = 0; i < 5; i++) {
        await this.dismissPopups(page);
        
        if (await page.locator('input[placeholder*="填写标题"]').first().isVisible()) {
          console.log(`[${request.traceId}] Editor ready.`);
          break;
        }

        for (const selector of nextBtnSelectors) {
          const btn = page.locator(selector).first();
          if (await btn.isVisible()) {
            console.log(`[${request.traceId}] Clicking transition button: ${selector}`);
            await btn.click({ force: true });
            await page.waitForTimeout(3000);
            break;
          }
        }
        await page.waitForTimeout(2000);
      }

      // 3. Fill Content
      console.log(`[${request.traceId}] [Step 6] Filling Title and Text...`);
      
      if (request.title) {
        const titleInput = page.locator('input[placeholder*="填写标题"]').first();
        await titleInput.waitFor({ state: 'visible', timeout: 15000 });
        await titleInput.fill(request.title.slice(0, 20));
      }

      const contentBox = page.locator('#post-textarea').first();
      if (!await contentBox.isVisible()) {
         await page.locator('div[contenteditable="true"]').first().click();
      } else {
         await contentBox.click();
      }
      await page.waitForTimeout(500);
      await page.keyboard.type(request.text);

      // 5. Publish
      console.log(`[${request.traceId}] [Step 7] Publishing...`);
      
      let publishSuccess = false;
      const publishDeadline = Date.now() + 45000;
      const startUrl = page.url();

      while (Date.now() < publishDeadline) {
        await this.dismissPopups(page);
        
        // Strategy 1: Playwright's Shadow-piercing locator
        const shadowBtn = page.locator('xhs-publish-btn').locator('button.ce-btn.bg-red').first();
        if (await shadowBtn.isVisible()) {
          console.log(`[${request.traceId}] Found button inside Shadow DOM. Clicking...`);
          await shadowBtn.click({ force: true });
          // Wait to see if URL changes
          await page.waitForTimeout(3000);
          if (page.url() !== startUrl) {
            publishSuccess = true;
            break;
          }
        }

        // Strategy 2: Click the host component with PRECISE offset
        // The buttons are centered. Total width of (120 + 24 + 120) = 264px.
        // The red button center is at (ContainerCenter + 12px gap half + 60px button half) = Center + 72px.
        const host = page.locator('xhs-publish-btn').first();
        if (await host.isVisible()) {
          // Ensure it's in the viewport before taking bounding box
          await host.scrollIntoViewIfNeeded().catch(() => {});
          // Wait a moment for any sticky headers/footers to settle
          await page.waitForTimeout(500);

          const box = await host.boundingBox();
          if (box) {
            const targetX = box.x + (box.width / 2) + 72;
            const targetY = box.y + (box.height / 2);
            
            console.log(`[${request.traceId}] Host found. Moving to and clicking at ${targetX}, ${targetY}...`);
            await page.mouse.move(targetX, targetY);
            await page.waitForTimeout(200); // Small pause to simulate real user hover
            await page.mouse.click(targetX, targetY);
            
            // Wait to see if URL changes or a success indicator appears
            await page.waitForTimeout(4000);
            if (page.url() !== startUrl || page.url().includes('success') || page.url().includes('home')) {
              console.log(`[${request.traceId}] URL changed or success detected: ${page.url()}`);
              publishSuccess = true;
              break;
            }
          }
        }

        // Strategy 3: Keyboard fallback (Enter key)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        if (page.url() !== startUrl) {
           publishSuccess = true;
           break;
        }

        console.log(`[${request.traceId}] Still on publish page... retrying click.`);
      }

      if (!publishSuccess) {
        await this.captureDebugScreenshot(page, 'publish-failed-verify');
        throw new Error("Clicked but URL did not change. The '发布' button might be blocked or inactive.");
      }

      console.log(`[${request.traceId}] Post-publish URL: ${page.url()}`);
      return { 
        success: true, 
        publishedUrl: page.url(),
        metadata: { status: 'PUBLISHED' }
      };

    } catch (error: any) {
      console.error(`[${request.traceId}] Rednote Publish Failed:`, error.message);
      await this.captureDebugScreenshot(page, 'publish-failed');
      return { success: false, error: error.message };
    } finally {
      await browser.close().catch(() => {});
    }
  }
}
