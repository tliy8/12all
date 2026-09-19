'use client';

import { useTransition, useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { deletePostAction, duplicatePostAction, unschedulePostAction, retryAllFailedJobsAction, schedulePostAction } from '@/app/posts/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function PostRowActions({ postId, status }: { postId: string, status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // State for scheduling dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const handleEdit = () => {
    router.push(`/posts/new?edit=${postId}`);
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicatePostAction(postId);
      if (result.success) {
        toast.success("Post duplicated successfully!");
      } else {
        toast.error(`Failed to duplicate: ${result.error}`);
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    startTransition(async () => {
      const result = await deletePostAction(postId);
      if (result.success) {
        toast.success("Post deleted.");
      } else {
        toast.error(`Failed to delete: ${result.error}`);
      }
    });
  };

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryAllFailedJobsAction(postId);
      if (result.success) {
        toast.success("Failed jobs reset! Workers will retry them shortly.");
      } else {
        toast.error(`Failed to retry: ${result.error}`);
      }
    });
  };

  const handleUnschedule = () => {
    if (!window.confirm("Move back to drafts? The post will be unscheduled.")) return;
    
    startTransition(async () => {
      const result = await unschedulePostAction(postId);
      if (result.success) {
        toast.success("Post unscheduled and returned to Drafts.");
      } else {
        toast.error(`Failed to unschedule: ${result.error}`);
      }
    });
  };

  const submitSchedule = () => {
    if (!scheduleDate) return;
    startTransition(async () => {
      const result = await schedulePostAction(postId, new Date(scheduleDate).toISOString());
      if (result.success) {
        toast.success("Post scheduled successfully!");
        setIsScheduleOpen(false);
      } else {
        toast.error(`Failed to schedule: ${result.error}`);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isPending}
          >
            <MoreHorizontal className={`w-4 h-4 ${isPending ? 'animate-pulse' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Contextual Actions Based on Status */}
          {status === 'drafts' && (
            <>
              <DropdownMenuItem onClick={handleEdit} disabled={isPending}>Edit post</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsScheduleOpen(true)} disabled={isPending}>Schedule...</DropdownMenuItem>
            </>
          )}
          
          {status === 'scheduled' && (
            <>
              <DropdownMenuItem onClick={handleEdit} disabled={isPending}>Edit post</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsScheduleOpen(true)} disabled={isPending}>Reschedule...</DropdownMenuItem>
              <DropdownMenuItem onClick={handleUnschedule} disabled={isPending}>Unschedule</DropdownMenuItem>
            </>
          )}
          
          {status === 'published' && (
            <>
              <DropdownMenuItem disabled={isPending}>View Live</DropdownMenuItem>
              <DropdownMenuItem disabled={isPending}>View Analytics</DropdownMenuItem>
            </>
          )}

          {status === 'missed' && (
            <>
              <DropdownMenuItem onClick={handleRetry} disabled={isPending} className="font-medium text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:text-blue-400">Retry Failed</DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} disabled={isPending}>Edit post</DropdownMenuItem>
            </>
          )}

          {/* Global Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>Duplicate as draft</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} disabled={isPending} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <input
              type="datetime-local"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={submitSchedule} disabled={isPending || !scheduleDate}>
              {isPending ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
