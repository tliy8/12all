import { BasePublisher, PublishRequest, PublishResponse } from './types';
import { db } from '@/lib/database';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookPublisher implements BasePublisher {
  platformName = 'facebook';

  async validateSession(): Promise<boolean> {
    try {
      const { data, error } = await db.from('platform_credentials')
        .select('auth_payload')
        .eq('platform_name', 'facebook')
        .eq('is_active', true)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  }

  private async getDecryptedToken(traceId: string): Promise<string> {
    const { data, error } = await db.from('platform_credentials')
      .select('auth_payload')
      .eq('platform_name', 'facebook')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Facebook is not connected. Missing credentials.');
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('System misconfiguration: Encryption key missing.');
    }

    try {
      const rawToken = await decrypt(data.auth_payload, encryptionKey);
      return rawToken;
    } catch (e: any) {
      throw new Error(`Failed to decrypt Facebook token: ${e.message}`);
    }
  }

  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      const token = await this.getDecryptedToken(request.traceId);
      
      // Facebook Graph API logic for feed posting (text/links only for now)
      // Images and Videos require complex multipart/resumable upload logic which we will build in phase 2.
      // For now, we support text posts.
      
      // We are using a Page Access Token, so the endpoint /me/feed posts to the page.
      const url = new URL(`${BASE_URL}/me/feed`);
      
      const payload: Record<string, string> = {
        message: request.text,
        access_token: token,
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData: any = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'Unknown Facebook API error');
      }

      return {
        success: true,
        publishedUrl: `https://facebook.com/${responseData.id}`,
        metadata: { postId: responseData.id }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred during Facebook publish'
      };
    }
  }
}
