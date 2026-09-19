'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { retryPublishJobAction } from '@/app/posts/actions';
import { toast } from 'sonner';

interface RetryButtonProps {
  jobId: string;
}

export function RetryButton({ jobId }: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    const result = await retryPublishJobAction(jobId);
    setIsRetrying(false);

    if (result.success) {
      toast.success('Job re-enqueued for publishing!');
    } else {
      toast.error(`Retry failed: ${result.error}`);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRetry} 
      disabled={isRetrying}
      className="h-7 px-2 text-[10px]"
    >
      <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
      Retry
    </Button>
  );
}
