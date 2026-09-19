import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.resolve(process.cwd(), '.temp');

/**
 * Downloads multiple media files to a local temp directory.
 * Returns an array of absolute local file paths.
 */
export async function downloadMedia(urls: string[]): Promise<string[]> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const localPaths: string[] = [];

  for (const url of urls) {
    try {
      console.log(`Downloading: ${url}`);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      // Extract extension or default to .tmp
      const urlPath = new URL(url).pathname;
      const ext = path.extname(urlPath) || '.tmp';
      const fileName = `${uuidv4()}${ext}`;
      const localPath = path.resolve(TEMP_DIR, fileName);
      console.log(`[MediaUtils] Target local path: ${localPath}`);

      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`[MediaUtils] Download complete: ${localPath} (Size: ${fs.statSync(localPath).size} bytes)`);
          resolve(true);
        });
        writer.on('error', reject);
      });

      localPaths.push(localPath);
    } catch (err: any) {
      console.error(`Failed to download ${url}:`, err.message);
    }
  }

  return localPaths;
}

/**
 * Cleans up temporary files.
 */
export function cleanupMedia(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err: any) {
      console.error(`Failed to delete temp file ${filePath}:`, err.message);
    }
  }
}
