'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PostPreviewProps {
  platformId: string;
  platformName: string;
  title: string;
  content: string;
  mediaUrls: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformPreview({
  platformId,
  platformName,
  title,
  content,
  mediaUrls,
  isOpen,
  onClose,
}: PostPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, platformId]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  // Helper to render Facebook/Twitter/LinkedIn style image grids
  const renderGridCollage = () => {
    if (mediaUrls.length === 0) return null;
    if (mediaUrls.length === 1) {
      return <img src={mediaUrls[0]} alt="Post" className="w-full h-auto max-h-[500px] object-cover" />;
    }
    return (
      <div className={`grid gap-0.5 ${mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {mediaUrls.slice(0, 4).map((url, i) => (
          <div key={i} className="relative aspect-square">
            <img src={url} alt="Post" className="w-full h-full object-cover" />
            {mediaUrls.length > 4 && i === 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                +{mediaUrls.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Helper to render carousel indicators for Instagram/Rednote
  const renderCarouselOverlay = () => {
    if (mediaUrls.length <= 1) return null;
    return (
      <>
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
          {currentIndex + 1} / {mediaUrls.length}
        </div>
        
        {/* Navigation Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </>
    );
  };

  // Simulate platform-specific styling
  const renderPreviewContent = () => {
    switch (platformId) {
      case 'instagram':
        return (
          <div className="max-w-[400px] mx-auto border bg-white text-black font-sans rounded-sm shadow-sm overflow-hidden">
            <div className="flex items-center p-3 space-x-2 border-b">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600" />
              <span className="font-semibold text-sm text-black">your_username</span>
            </div>
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative group">
              {mediaUrls[0] ? (
                <>
                  <img src={mediaUrls[currentIndex]} alt="Post" className="w-full h-full object-cover transition-opacity duration-300" />
                  {renderCarouselOverlay()}
                </>
              ) : (
                <span className="text-muted-foreground text-xs">No media uploaded</span>
              )}
            </div>
            <div className="p-3 space-y-2 text-black">
              <div className="flex space-x-4">
                <span className="font-bold text-lg inline-block">♡</span>
                <span className="font-bold text-lg inline-block">💬</span>
                <span className="font-bold text-lg inline-block">✈</span>
              </div>
              <p className="text-sm">
                <span className="font-semibold mr-2">your_username</span>
                {title && <span className="font-bold block mb-1">{title}</span>}
                {content || "No caption entered yet..."}
              </p>
            </div>
          </div>
        );
      case 'twitter':
        return (
          <div className="max-w-[500px] mx-auto p-4 border bg-white text-black rounded-xl font-sans">
            <div className="flex space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-sm text-black">Your Name</span>
                  <span className="text-gray-500 text-sm text-black">@username · 1m</span>
                </div>
                <div className="mt-1 text-[15px] leading-normal text-black">
                  {title && <p className="font-bold mb-1">{title}</p>}
                  <p>{content || "What's happening?"}</p>
                </div>
                {mediaUrls.length > 0 && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
                     {renderGridCollage()}
                  </div>
                )}
                <div className="mt-4 flex justify-between text-gray-500 max-w-[400px]">
                  <span>💬</span> <span>⇄</span> <span>♡</span> <span>📊</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'douyin':
      case 'tiktok':
        return (
          <div className="max-w-[400px] mx-auto bg-black text-white rounded-3xl overflow-hidden aspect-[9/16] relative shadow-2xl group">
            {mediaUrls[0] ? (
              <>
                <img src={mediaUrls[currentIndex]} alt="Post" className="w-full h-full object-cover opacity-80 transition-opacity duration-300" />
                {mediaUrls.length > 1 && (
                  <>
                    <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded z-10">
                      图集 {currentIndex + 1}/{mediaUrls.length}
                    </div>
                    <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 italic">视频预览区</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="font-bold text-lg mb-1">@你的抖音号</p>
              {title && <p className="font-bold text-white mb-2 line-clamp-2">{title}</p>}
              <p className="text-sm line-clamp-3 mb-4">{content || "记录美好生活..."}</p>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white rounded-full animate-spin" />
                <span className="text-xs">创作的原声 - 你的抖音号</span>
              </div>
            </div>
            <div className="absolute right-4 bottom-32 flex flex-col space-y-6 items-center">
               <div className="flex flex-col items-center"><span className="text-2xl">❤️</span><span className="text-xs">12.3w</span></div>
               <div className="flex flex-col items-center"><span className="text-2xl">💬</span><span className="text-xs">456</span></div>
               <div className="flex flex-col items-center"><span className="text-2xl">🔖</span><span className="text-xs">78</span></div>
            </div>
          </div>
        );
      case 'rednote':
        return (
          <div className="max-w-[400px] mx-auto border bg-white text-black font-sans rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-semibold text-sm text-black">你的昵称</span>
              </div>
              <button className="text-[#FF2442] border border-[#FF2442] rounded-full px-3 py-1 text-xs font-semibold">
                关注
              </button>
            </div>
            <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden relative group">
              {mediaUrls[0] ? (
                <>
                  <img src={mediaUrls[currentIndex]} alt="Post" className="w-full h-full object-cover transition-opacity duration-300" />
                  {renderCarouselOverlay()}
                </>
              ) : (
                <span className="text-muted-foreground text-xs">暂无图片</span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {title && <h1 className="text-lg font-bold leading-snug text-black">{title}</h1>}
              <p className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                {content || "说点什么..."}
              </p>
              <div className="flex items-center justify-between text-gray-500 pt-2 text-sm font-medium">
                <span className="flex items-center gap-1">♡ 赞</span>
                <span className="flex items-center gap-1">☆ 收藏</span>
                <span className="flex items-center gap-1">💬 评论</span>
              </div>
            </div>
          </div>
        );
      case 'facebook':
        return (
          <div className="max-w-[500px] mx-auto bg-white border border-gray-200 rounded-lg shadow-sm font-sans text-black">
            <div className="flex items-center px-4 py-3 space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div>
                <div className="font-bold text-[15px] hover:underline cursor-pointer">Your Page Name</div>
                <div className="flex items-center text-gray-500 text-[13px]">
                  <span>Just now</span>
                  <span className="mx-1">·</span>
                  <span>🌎</span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-3 text-[15px] leading-snug">
              {title && <p className="font-bold mb-1">{title}</p>}
              <p className="whitespace-pre-wrap">{content || "What's on your mind?"}</p>
            </div>
            {mediaUrls.length > 0 && (
              <div className="w-full bg-gray-100 flex items-center justify-center border-y border-gray-200 overflow-hidden">
                {renderGridCollage()}
              </div>
            )}
            <div className="px-4 py-2">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-gray-500 text-[15px]">
                <span className="flex items-center gap-1">👍 <span className="text-sm">0</span></span>
                <div className="text-sm flex gap-3">
                  <span>0 comments</span>
                  <span>0 shares</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 text-gray-600 font-semibold text-[15px]">
                <button className="flex-1 py-2 hover:bg-gray-100 rounded-md flex items-center justify-center gap-2">👍 Like</button>
                <button className="flex-1 py-2 hover:bg-gray-100 rounded-md flex items-center justify-center gap-2">💬 Comment</button>
                <button className="flex-1 py-2 hover:bg-gray-100 rounded-md flex items-center justify-center gap-2">⤴️ Share</button>
              </div>
            </div>
          </div>
        );
      case 'linkedin':
        return (
          <div className="max-w-[540px] mx-auto bg-white border border-gray-200 rounded-lg shadow-sm font-sans text-black">
            <div className="flex items-start px-4 py-3 space-x-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div>
                <div className="font-bold text-[14px] leading-tight">Your Name</div>
                <div className="text-gray-500 text-[12px] leading-tight mt-0.5">Your Professional Headline</div>
                <div className="flex items-center text-gray-500 text-[12px] mt-0.5">
                  <span>Now</span>
                  <span className="mx-1">•</span>
                  <span>🌎</span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-3 text-[14px] leading-normal whitespace-pre-wrap">
              {title && <p className="font-bold mb-1">{title}</p>}
              {content || "What do you want to talk about?"}
            </div>
            {mediaUrls.length > 0 && (
              <div className="w-full bg-[#f8fafd] overflow-hidden">
                {renderGridCollage()}
              </div>
            )}
            <div className="px-4 py-2">
               <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-gray-500 text-[12px]">
                <span className="flex items-center gap-1">👍 0</span>
                <span>0 comments</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-gray-600 font-semibold text-[14px]">
                <button className="flex-1 py-3 hover:bg-gray-100 rounded-md flex items-center justify-center gap-1">👍 Like</button>
                <button className="flex-1 py-3 hover:bg-gray-100 rounded-md flex items-center justify-center gap-1">💬 Comment</button>
                <button className="flex-1 py-3 hover:bg-gray-100 rounded-md flex items-center justify-center gap-1">🔄 Repost</button>
                <button className="flex-1 py-3 hover:bg-gray-100 rounded-md flex items-center justify-center gap-1">✈️ Send</button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 border rounded-lg bg-card">
            <Badge className="mb-2">{platformName}</Badge>
            {title && <h3 className="font-bold text-lg mb-2">{title}</h3>}
            <p className="text-sm whitespace-pre-wrap">{content || "No content"}</p>
            {mediaUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="Media" className="rounded-md object-cover aspect-video" />
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">{platformName} Detail Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] mt-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            {renderPreviewContent()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
