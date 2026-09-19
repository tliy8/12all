import { PlaywrightPublisher } from './playwright-base';
import { PublishRequest, PublishResponse } from './types';
import fs from 'fs';

export class TikTokPublisher extends PlaywrightPublisher {
  platformName = 'tiktok';
  loginUrl = 'https://www.tiktok.com/login';

  async publish(request: PublishRequest): Promise<PublishResponse> {
    const { browser, context } = await this.getContext(request.traceId);
    const page = await context.newPage();

    try {
      console.log(`[${request.traceId}] Navigating to TikTok Upload...`);
      await page.goto('https://www.tiktok.com/upload?lang=en', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000); 

      // 1. Upload Media using FileChooser strategy
      console.log(`[${request.traceId}] Waiting for TikTok upload button...`);
      // TikTok often has "Select file" or similar
      const uploadButton = page.getByText("Select files", { exact: false }).first();
      await uploadButton.waitFor({ state: 'visible', timeout: 30000 });

      if (request.mediaUrls.length > 0) {
        console.log(`[${request.traceId}] Triggering file chooser for ${request.mediaUrls[0]}`);
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 15000 }),
          uploadButton.click()
        ]);
        await fileChooser.setFiles(request.mediaUrls[0]);
      } else {
        throw new Error("No media provided for TikTok");
      }

      // 2. Wait for upload to process (TikTok shows a preview or progress bar)
      console.log(`[${request.traceId}] Waiting for upload processing...`);
      await page.waitForTimeout(5000); 

      // 3. Fill Caption (TikTok combines Title and Text usually in one box or has a specific 'Title' if enabled)
      // The main caption box is often a contenteditable div
      const captionBox = page.locator('div[contenteditable="true"]').first();
      await captionBox.click();
      
      const fullText = request.title ? `${request.title}\n\n${request.text}` : request.text;
      await captionBox.fill(fullText);
      console.log(`[${request.traceId}] Filled caption.`);

      // 4. Click Post
      const postButton = page.locator('button:has-text("Post")');
      await postButton.scrollIntoViewIfNeeded();
      
      console.log(`[${request.traceId}] Clicking 'Post' button...`);
      await postButton.click();
      
      // Wait for success
      await page.waitForTimeout(5000);

      return { 
        success: true, 
        publishedUrl: page.url(),
        metadata: { status: 'PUBLISHED' }
      };

    } catch (error: any) {
      console.error(`[${request.traceId}] TikTok Publish Failed:`, error.message);
      return { success: false, error: error.message };
    } finally {
      await browser.close();
    }
  }
}
