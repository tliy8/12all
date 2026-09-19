'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPostAction, getPostAction, updatePostAction } from '../actions';
import { MediaUploader } from '@/components/media-uploader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { PlatformPreview } from '@/components/platform-preview';
import { Eye, Smartphone, AlertTriangle, XCircle, Info, Settings2, Trash2, Calendar as CalendarIcon } from 'lucide-react';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'rednote', name: 'Xiaohongshu / Rednote' },
  { id: 'douyin', name: 'Douyin' },
  { id: 'tiktok', name: 'TikTok' },
];

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [masterTitle, setMasterTitle] = useState('');
  const [masterText, setMasterText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Platform Overrides State
  const [platformOverrides, setPlatformOverrides] = useState<Record<string, { enabled: boolean, title: string, text: string }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<{ id: string, name: string } | null>(null);

  // Initialize scheduledDate from URL parameter if present, otherwise default to current local date/time if no editId
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const queryDate = searchParams.get('date');
    if (queryDate) {
      // Create a local date string for datetime-local input at 12:00 PM
      return `${queryDate}T12:00`;
    }
    return '';
  });

  useEffect(() => {
    if (editId) {
      getPostAction(editId).then(res => {
        if (res.success && res.data) {
          setMasterTitle(res.data.master_title || '');
          setMasterText(res.data.master_text || '');
          setMediaUrls(res.data.media_urls || []);
          
          const jobs = res.data.publish_jobs || [];
          const platforms = jobs.map((j: any) => j.platform);
          setSelectedPlatforms(Array.from(new Set(platforms)) as string[]);
          
          const overrides: Record<string, { enabled: boolean, title: string, text: string }> = {};
          jobs.forEach((j: any) => {
             if (j.metadata && j.metadata.enabled) {
                overrides[j.platform] = j.metadata;
             }
          });
          setPlatformOverrides(overrides);
          
          if (res.data.scheduled_for) {
             // Convert UTC to local datetime-local format (YYYY-MM-DDTHH:mm)
             const d = new Date(res.data.scheduled_for);
             const y = d.getFullYear();
             const m = String(d.getMonth() + 1).padStart(2, '0');
             const day = String(d.getDate()).padStart(2, '0');
             const h = String(d.getHours()).padStart(2, '0');
             const min = String(d.getMinutes()).padStart(2, '0');
             setScheduledDate(`${y}-${m}-${day}T${h}:${min}`);
          }
        } else {
          toast.error("Failed to load post for editing.");
        }
      });
    }
  }, [editId]);

  const enableOverride = (platformId: string) => {
    setPlatformOverrides(prev => ({
      ...prev,
      [platformId]: {
        enabled: true,
        title: prev[platformId]?.title || masterTitle,
        text: prev[platformId]?.text || masterText,
      }
    }));
  };

  const removeOverride = (platformId: string) => {
    setPlatformOverrides(prev => {
      const next = { ...prev };
      if (next[platformId]) {
        next[platformId].enabled = false;
      }
      return next;
    });
  };

  const updateOverride = (platformId: string, field: 'title' | 'text', value: string) => {
    setPlatformOverrides(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value
      }
    }));
  };

  // PLATFORM COMPLIANCE CHECKER
  const complianceIssues = useMemo(() => {
    const issues: { platformId: string; platformName: string; type: 'error' | 'warning' | 'info'; message: string }[] = [];
    
    selectedPlatforms.forEach(platformId => {
      const platformName = PLATFORMS.find(p => p.id === platformId)?.name || platformId;
      const isOverridden = platformOverrides[platformId]?.enabled;
      
      const evalTitle = isOverridden ? platformOverrides[platformId].title : masterTitle;
      const evalText = isOverridden ? platformOverrides[platformId].text : masterText;

      if (platformId === 'twitter') {
        if (evalText.length > 280) {
          issues.push({ platformId, platformName, type: 'error', message: 'Caption exceeds 280 character limit.' });
        }
        if (mediaUrls.length > 4) {
          issues.push({ platformId, platformName, type: 'error', message: 'Max 4 media items allowed.' });
        }
      }

      if (platformId === 'rednote') {
        if (!evalTitle || evalTitle.trim() === '') {
          issues.push({ platformId, platformName, type: 'error', message: 'Title is strictly required.' });
        } else if (evalTitle.length > 20) {
          issues.push({ platformId, platformName, type: 'error', message: 'Title exceeds strict 20 character limit.' });
        }
        if (evalText.length > 1000) {
          issues.push({ platformId, platformName, type: 'error', message: 'Caption exceeds 1,000 character limit.' });
        }
        if (mediaUrls.length > 9) {
          issues.push({ platformId, platformName, type: 'error', message: 'Max 9 media items allowed.' });
        }
      }

      if (platformId === 'douyin') {
        if (evalText.length > 55) {
          issues.push({ platformId, platformName, type: 'error', message: 'Caption exceeds strict 55 character limit.' });
        }
        if (mediaUrls.length === 0) {
          issues.push({ platformId, platformName, type: 'error', message: 'At least 1 media item is required.' });
        } else if (!mediaUrls.some(url => url.includes('.mp4') || url.includes('.webm') || url.includes('.mov'))) {
           issues.push({ platformId, platformName, type: 'warning', message: 'A video is highly recommended for optimal reach.' });
        }
      }

      if (platformId === 'tiktok') {
        if (evalText.length > 2200) {
          issues.push({ platformId, platformName, type: 'error', message: 'Caption exceeds 2,200 character limit.' });
        }
        if (mediaUrls.length === 0) {
          issues.push({ platformId, platformName, type: 'error', message: 'At least 1 media item is required.' });
        } else if (!mediaUrls.some(url => url.includes('.mp4') || url.includes('.webm') || url.includes('.mov'))) {
           issues.push({ platformId, platformName, type: 'warning', message: 'A video is highly recommended for optimal reach.' });
        }
      }

      if (platformId === 'instagram') {
        if (evalText.length > 2200) {
          issues.push({ platformId, platformName, type: 'error', message: 'Caption exceeds 2,200 character limit.' });
        }
        if (mediaUrls.length > 10) {
          issues.push({ platformId, platformName, type: 'error', message: 'Max 10 media items allowed (Carousel).' });
        }
        if (mediaUrls.length === 0) {
          issues.push({ platformId, platformName, type: 'error', message: 'At least 1 media item is required.' });
        }
      }
    });

    return issues;
  }, [selectedPlatforms, masterTitle, masterText, mediaUrls, platformOverrides]);

  const hasCriticalErrors = complianceIssues.some(i => i.type === 'error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform to publish to');
      return;
    }
    
    if (hasCriticalErrors) {
      toast.error('Please resolve critical platform compliance errors before publishing.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('master_title', masterTitle);
    formData.append('master_text', masterText);
    formData.append('media_urls', JSON.stringify(mediaUrls));
    formData.append('platforms', JSON.stringify(selectedPlatforms));
    formData.append('platform_overrides', JSON.stringify(platformOverrides));
    
    if (scheduledDate) {
      // Convert local datetime string to UTC ISO string for the database
      const utcDate = new Date(scheduledDate).toISOString();
      formData.append('scheduled_for', utcDate);
    }

    if (editId) {
      const result = await updatePostAction(editId, formData);
      setIsSubmitting(false);

      if (result.success) {
        toast.success('Post updated successfully');
        router.push('/posts');
      } else {
        toast.error('Failed to update post: ' + result.error);
      }
    } else {
      const result = await createPostAction(formData);
      setIsSubmitting(false);

      if (result.success) {
        toast.success('Post scheduled successfully');
        router.push('/dashboard');
      } else {
        toast.error('Failed to create post: ' + result.error);
      }
    }
  };

  const togglePlatform = (id: string, checked: boolean) => {
    setSelectedPlatforms(prev => 
      checked ? [...prev, id] : prev.filter(p => p !== id)
    );
  };

  return (
    <div className="container max-w-6xl py-10 px-4">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Editor Form */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{editId ? 'Edit Post' : 'Create New Post'}</CardTitle>
              <CardDescription>
                {editId ? 'Update your draft. Note that existing scheduled jobs may be reset.' : 'Draft your omnichannel post. The system will automatically check for platform compliance.'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-8">
                
                {/* MASTER SETTINGS */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight mb-4">Master Content</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title (Optional)</label>
                        <input
                          type="text"
                          placeholder="Engaging headline..."
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={masterTitle}
                          onChange={(e) => setMasterTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                          <span>Caption</span>
                        </label>
                        <Textarea
                          placeholder="What's on your mind? This will be posted to all selected platforms."
                          className="min-h-32"
                          value={masterText}
                          onChange={(e) => setMasterText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Media</label>
                        <MediaUploader onUploadComplete={setMediaUrls} />
                        {mediaUrls.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {mediaUrls.length} file(s) attached.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold tracking-tight">Scheduling</h3>
                    <div className="space-y-2 max-w-sm">
                      <label className="text-sm font-medium">Publish Date & Time (Optional)</label>
                      <div className="relative group">
                        <input
                          type="datetime-local"
                          style={{ colorScheme: 'dark' }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/50 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground">Leave blank to publish immediately.</p>
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-sm font-medium">Publish to</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-xl p-4 bg-muted/30">
                        {PLATFORMS.map((platform) => (
                          <div key={platform.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform.id}
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={(checked) => togglePlatform(platform.id, checked as boolean)}
                            />
                            <label
                              htmlFor={platform.id}
                              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {platform.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PLATFORM COMPLIANCE CHECKER */}
                {selectedPlatforms.length > 0 && (
                  <div className="pt-6 border-t space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Compliance Checker</h3>
                    
                    {complianceIssues.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        All good! Your post meets the requirements for all selected platforms.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {complianceIssues.map((issue, idx) => {
                          const isOverridden = platformOverrides[issue.platformId]?.enabled;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                                issue.type === 'error' 
                                  ? 'border-destructive/30 bg-destructive/10 text-destructive' 
                                  : issue.type === 'warning'
                                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500'
                                  : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              <div className="shrink-0">
                                {issue.type === 'error' && <XCircle className="w-4 h-4" />}
                                {issue.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                                {issue.type === 'info' && <Info className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold uppercase text-xs mr-2">{issue.platformName}:</span>
                                {issue.message}
                              </div>
                              {issue.type === 'error' && !isOverridden && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs bg-background shrink-0" 
                                  onClick={() => enableOverride(issue.platformId)}
                                  type="button"
                                >
                                  Fix for {issue.platformName}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVE OVERRIDES UI */}
                {Object.keys(platformOverrides).some(p => platformOverrides[p].enabled && selectedPlatforms.includes(p)) && (
                   <div className="space-y-4 pt-6 border-t">
                      <div className="flex items-center space-x-2">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold tracking-tight">Active Overrides</h3>
                      </div>
                      <div className="space-y-4">
                        {selectedPlatforms.map(platformId => {
                          const override = platformOverrides[platformId];
                          if (!override?.enabled) return null;
                          const platformName = PLATFORMS.find(p => p.id === platformId)?.name;

                          return (
                            <div key={platformId} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                              <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                                <span className="font-semibold text-sm">{platformName} Special Case</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeOverride(platformId)} type="button">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="p-4 space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (Optional)</label>
                                  <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={override.title}
                                    onChange={(e) => updateOverride(platformId, 'title', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 flex justify-between">
                                    <span>Caption</span>
                                    {platformId === 'twitter' && (
                                      <span className={override.text.length > 280 ? 'text-destructive font-bold' : ''}>
                                        {override.text.length} / 280
                                      </span>
                                    )}
                                    {platformId === 'douyin' && (
                                      <span className={override.text.length > 55 ? 'text-destructive font-bold' : ''}>
                                        {override.text.length} / 55
                                      </span>
                                    )}
                                    {platformId === 'rednote' && (
                                      <span className={override.text.length > 1000 ? 'text-destructive font-bold' : ''}>
                                        {override.text.length} / 1000
                                      </span>
                                    )}
                                  </label>
                                  <Textarea
                                    className="min-h-24 text-sm"
                                    value={override.text}
                                    onChange={(e) => updateOverride(platformId, 'text', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || hasCriticalErrors} 
                  className={`px-8 shadow-sm ${hasCriticalErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (editId ? 'Saving...' : 'Scheduling...') : (editId ? 'Save Changes' : 'Publish Post')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* RIGHT: Platform Previews */}
        <div className="w-full lg:w-[350px] space-y-4">
          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
            <Eye className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Live Previews</h3>
          </div>
          
          {selectedPlatforms.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Select a platform to see how your post will look.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlatforms.map((id) => {
                const platform = PLATFORMS.find(p => p.id === id);
                return (
                  <Card key={id} className="cursor-pointer hover:border-primary transition-colors group" onClick={() => setPreviewPlatform(platform || null)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium">{platform?.name}</span>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Preview Modal */}
      {previewPlatform && (
        <PlatformPreview
          platformId={previewPlatform.id}
          platformName={previewPlatform.name}
          title={platformOverrides[previewPlatform.id]?.enabled ? platformOverrides[previewPlatform.id].title : masterTitle}
          content={platformOverrides[previewPlatform.id]?.enabled ? platformOverrides[previewPlatform.id].text : masterText}
          mediaUrls={mediaUrls}
          isOpen={!!previewPlatform}
          onClose={() => setPreviewPlatform(null)}
        />
      )}
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="container py-10 flex items-center justify-center text-muted-foreground">Loading composer...</div>}>
      <NewPostForm />
    </Suspense>
  );
}
