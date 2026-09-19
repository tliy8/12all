import { PlaywrightPublisher } from './playwright-base';
import { PublishRequest, PublishResponse } from './types';

export class DouyinPublisher extends PlaywrightPublisher {
  platformName = 'douyin';
  loginUrl = 'https://creator.douyin.com/';

  private async dismissPopups(page: Page) {
    for (let i = 0; i < 3; i++) {
      const dismissButton = page.getByText("我知道了", { exact: true }).first();
      const visible = await dismissButton.isVisible().catch(() => false);
      if (!visible) break;
      await dismissButton.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  private async selectMusic(page: Page, musicName: string, traceId: string) {
    console.log(`[${traceId}] Selecting music: ${musicName}`);
    await this.dismissPopups(page);

    const musicButton = page.getByText("选择音乐").last();
    await musicButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await musicButton.click();
    await page.waitForTimeout(2000);
    await this.dismissPopups(page);

    const searchInput = page
      .locator('input[placeholder*="搜索"], input[placeholder*="音乐"]')
      .first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(musicName);
      await page.waitForTimeout(500);
      await searchInput.press("Enter");
    } else {
      console.warn(`[${traceId}] Music search input not found directly.`);
    }

    await page.waitForTimeout(3000);
    await this.dismissPopups(page);

    // Try to find the "Use" (使用) button for the first result
    const useButton = page.getByText("使用", { exact: true }).first();
    if (await useButton.isVisible()) {
      await useButton.click();
      console.log(`[${traceId}] Music selected successfully.`);
    } else {
      console.warn(`[${traceId}] 'Use' button for music not found.`);
    }
    await page.waitForTimeout(1000);
  }

  private async selectLocation(page: Page, locationName: string, traceId: string) {
    console.log(`[${traceId}] Selecting location: ${locationName}`);
    await this.dismissPopups(page);

    // Common selector for location on Douyin
    const locationTrigger = page.getByText("添加地点").first();
    if (!await locationTrigger.isVisible()) {
      console.warn(`[${traceId}] Location trigger '添加地点' not found.`);
      return;
    }

    await locationTrigger.click();
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="搜索地点"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(locationName);
      await page.waitForTimeout(1500);
      
      // Click the first result in the list
      // Usually, results appear in a dropdown/list
      const firstResult = page.locator('.semi-select-option, [class*="poi-item"]').first();
      if (await firstResult.isVisible()) {
        await firstResult.click();
        console.log(`[${traceId}] Location selected.`);
      }
    }
  }

  async publish(request: PublishRequest): Promise<PublishResponse> {
    const { browser, context } = await this.getContext(request.traceId);
    const page = await context.newPage();

    try {
      console.log(`[${request.traceId}] Navigating to Douyin Upload...`);
      
      const mediaFile = request.mediaUrls[0];
      const isVideo = mediaFile.toLowerCase().match(/\.(mp4|mov|avi|wmv|mkv)$/);

      // Use the specific upload URL from the reference repo
      const uploadUrl = isVideo
        ? "https://creator.douyin.com/creator-micro/content/upload?default-tab=1"
        : "https://creator.douyin.com/creator-micro/content/upload?default-tab=3";

      await page.goto(uploadUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });

      await this.dismissPopups(page);
      await page.waitForTimeout(1500);

      // 1. Upload Media
      const uploadButtonText = isVideo ? "上传视频" : "上传图文";
      const uploadButton = page.getByText(uploadButtonText).first();
      await uploadButton.waitFor({ state: 'visible', timeout: 30000 });
      await uploadButton.scrollIntoViewIfNeeded();

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 15000 }),
        uploadButton.click()
      ]);

      await fileChooser.setFiles(request.mediaUrls);
      console.log(`[${request.traceId}] Files selected, waiting for processing...`);
      await page.waitForTimeout(10000); 
      await this.dismissPopups(page);

      // 2. Music Selection
      if (request.music) {
        await this.selectMusic(page, request.music, request.traceId);
      }

      // 3. Location Selection
      if (request.location) {
        await this.selectLocation(page, request.location, request.traceId);
      }

      // 4. Fill Title & Caption
      if (request.title) {
        const titleInput = page.getByPlaceholder("添加作品标题").first();
        if (await titleInput.isVisible()) {
          await titleInput.fill(request.title.slice(0, 30));
        }
      }
      
      const captionBox = page.locator('div[contenteditable="true"]').first();
      await captionBox.click();
      await page.keyboard.type(request.text);

      // 5. Click Post
      const publishBtn = page.getByRole("button", { name: "发布", exact: true }).first();
      await publishBtn.scrollIntoViewIfNeeded();
      await publishBtn.click();
      
      await page.waitForTimeout(5000);

      return { 
        success: true, 
        publishedUrl: page.url(),
        metadata: { status: 'PUBLISHED' }
      };

    } catch (error: any) {
      console.error(`[${request.traceId}] Douyin Publish Failed:`, error.message);
      return { success: false, error: error.message };
    } finally {
      await browser.close().catch(() => {});
    }
  }
}
