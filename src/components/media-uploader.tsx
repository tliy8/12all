'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  onUploadComplete: (urls: string[]) => void;
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const files = Array.from(event.target.files);
      const newUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
        setPreviews((prev) => [...prev, publicUrl]);
      }

      const updatedUrls = [...urls, ...newUrls];
      setUrls(updatedUrls);
      onUploadComplete(updatedUrls);
      toast.success('Media uploaded successfully');
    } catch (error: any) {
      toast.error('Error uploading media: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    const updatedUrls = urls.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setUrls(updatedUrls);
    onUploadComplete(updatedUrls);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {previews.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden bg-muted">
            <img src={url} alt="Preview" className="object-cover w-full h-full" />
            <button
              onClick={() => removeMedia(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {uploading && (
          <div className="aspect-square rounded-md flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 border-muted-foreground/20 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">Images or Videos</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={uploadFiles}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
