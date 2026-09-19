export interface PublishRequest {
  title?: string;
  text: string;
  mediaUrls: string[];
  traceId: string;
  music?: string;
  location?: string;
  tags?: string[];
}

export interface PublishResponse {
  success: boolean;
  publishedUrl?: string;
  error?: string;
  metadata?: any;
}

export interface BasePublisher {
  platformName: string;
  publish(request: PublishRequest): Promise<PublishResponse>;
  validateSession(): Promise<boolean>;
}

export type PlatformStatus = 'ACTIVE' | 'EXPIRED' | 'NOT_CONNECTED';
