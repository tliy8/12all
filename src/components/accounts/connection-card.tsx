'use client';

import { Search, RefreshCw, Trash2 } from "lucide-react";
import { disconnectAccount, toggleAccountStatus } from "@/app/accounts/actions";
import { launchLoginAction } from "@/app/admin/platforms/actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface ConnectionCardProps {
  id: string;
  platform: string;
  metadata: any;
  isActive: boolean;
  updatedAt: string;
}

const PLATFORM_CONFIG: Record<string, any> = {
  facebook: { name: 'Facebook', icon: () => <span className="font-bold text-[8px] leading-none text-white">FB</span>, bg: 'bg-blue-500' },
  instagram: { name: 'Instagram', icon: () => <span className="font-bold text-[8px] leading-none text-white">IG</span>, bg: 'bg-pink-500' },
  twitter: { name: 'X (Twitter)', icon: () => <span className="font-bold text-[8px] leading-none text-white">X</span>, bg: 'bg-zinc-800' },
  linkedin: { name: 'LinkedIn', icon: () => <span className="font-bold text-[8px] leading-none text-white">IN</span>, bg: 'bg-blue-600' },
  google_business: { name: 'Google Business', icon: Search, bg: 'bg-red-500' },
  tiktok: { name: 'TikTok', icon: () => <span className="font-bold text-[8px] leading-none text-white">TT</span>, bg: 'bg-zinc-800', loginUrl: 'https://www.tiktok.com/creator-center' },
  douyin: { name: 'Douyin', icon: () => <span className="font-bold text-[8px] leading-none text-white">DY</span>, bg: 'bg-zinc-800', loginUrl: 'https://creator.douyin.com/' },
  xiaohongshu: { name: 'Xiaohongshu', icon: () => <span className="font-bold text-[8px] leading-none text-white">XH</span>, bg: 'bg-red-600', loginUrl: 'https://creator.rednote.com/' },
};

export function ConnectionCard({ id, platform, metadata, isActive, updatedAt }: ConnectionCardProps) {
  const [isPending, startTransition] = useTransition();
  const config = PLATFORM_CONFIG[platform] || { name: platform, icon: Search, bg: 'bg-muted' };
  const Icon = config.icon;
  
  const displayName = metadata?.name || metadata?.username || metadata?.pageName || `@${platform}_account`;
  // Mock author for now, since it wasn't in metadata
  const authorName = "Admin User";

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectAccount(id);
      if (result.success) {
        toast.success(`Disconnected from ${config.name}`);
      } else {
        toast.error(`Failed to disconnect: ${result.error}`);
      }
    });
  };

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleAccountStatus(id, checked);
      if (result.success) {
        toast.success(checked ? `${config.name} connection resumed` : `${config.name} connection paused`);
      } else {
        toast.error(`Failed to update status: ${result.error}`);
      }
    });
  };

  const handleReconnect = () => {
    if (config.loginUrl) {
      toast.info(`Opening browser for ${config.name} login...`);
      startTransition(async () => {
        const result = await launchLoginAction(platform, config.loginUrl);
        if (result.success) {
          toast.success(`Successfully reconnected ${config.name}!`);
        } else {
          toast.error(`Failed to reconnect: ${result.error}`);
        }
      });
    }
  };

  return (
    <div className={`rounded-xl border border-border/50 bg-card p-5 w-full transition-all hover:border-border hover:shadow-md ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Top Section */}
      <div className="flex justify-between items-start">
        {/* Left: Avatar + Platform Info */}
        <div className="flex gap-4">
          {/* Avatar Container */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
               <div className="text-emerald-900 font-bold text-xl uppercase">
                 {displayName.substring(0, 1).replace('@', '')}
               </div>
            </div>
            {/* Small Platform Badge overlapping */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} border-2 border-card flex items-center justify-center shadow-sm`}>
              <Icon className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          
          {/* Names */}
          <div className="flex flex-col justify-center">
            <span className="font-semibold text-sm tracking-tight text-foreground truncate max-w-[200px]">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {config.name} <span className="mx-0.5 opacity-50">·</span> by {authorName}
            </span>
          </div>
        </div>
        
        {/* Right: Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
            {isActive ? 'Connected' : 'Paused'}
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={handleToggle} 
            className="data-[state=checked]:bg-primary" 
          />
        </div>
      </div>

      {/* Middle Box */}
      <div className="mt-5 rounded-lg border border-border/50 bg-background/50 p-4 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">Auto-boost posts</span>
          <span className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
            Automatically reshare top-performing posts on this account.
          </span>
        </div>
        <Switch checked={false} onCheckedChange={() => {}} />
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-border/50 my-4" />

      {/* Bottom Actions */}
      <div className="flex items-center gap-6 text-sm font-medium">
        {config.loginUrl ? (
          <button 
            onClick={handleReconnect}
            className="flex items-center gap-2 hover:text-foreground text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Reconnecting...' : 'Reconnect'}
          </button>
        ) : (
          <Link 
            href={`/api/auth/connect?platform=${platform}`}
            className="flex items-center gap-2 hover:text-foreground text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </Link>
        )}
        
        <button className="hover:text-foreground text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary rounded">
          Make default
        </button>
        
        <div className="flex-1" />
        
        <button 
          onClick={handleDisconnect} 
          className="flex items-center gap-2 hover:text-red-400 text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
        >
          <Trash2 className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
