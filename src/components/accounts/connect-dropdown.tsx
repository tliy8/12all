'use client';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { launchLoginAction } from "@/app/admin/platforms/actions";
import { useTransition } from "react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: () => <div className="font-bold text-xs">FB</div>, color: 'text-blue-500', isTierB: false },
  { id: 'instagram', name: 'Instagram', icon: () => <div className="font-bold text-xs">IG</div>, color: 'text-pink-500', isTierB: false },
  { id: 'twitter', name: 'X (Twitter)', icon: () => <div className="font-bold text-xs">X</div>, color: 'text-zinc-200', isTierB: false },
  { id: 'linkedin', name: 'LinkedIn', icon: () => <div className="font-bold text-xs">IN</div>, color: 'text-blue-400', isTierB: false },
  { id: 'google_business', name: 'Google Business', icon: Search, color: 'text-red-500', isTierB: false },
  { id: 'tiktok', name: 'TikTok', icon: () => <div className="font-bold text-xs">TT</div>, color: 'text-zinc-200', isTierB: true, loginUrl: 'https://www.tiktok.com/creator-center' },
  { id: 'douyin', name: 'Douyin', icon: () => <div className="font-bold text-xs">DY</div>, color: 'text-zinc-200', isTierB: true, loginUrl: 'https://creator.douyin.com/' },
  { id: 'xiaohongshu', name: 'Xiaohongshu', icon: () => <div className="font-bold text-xs">XH</div>, color: 'text-red-500', isTierB: true, loginUrl: 'https://creator.rednote.com/' },
];

export function ConnectDropdown() {
  const [isPending, startTransition] = useTransition();

  const handleConnect = (platform: typeof PLATFORMS[0]) => {
    if (platform.isTierB && platform.loginUrl) {
      toast.info(`Opening browser for ${platform.name} login...`);
      startTransition(async () => {
        const result = await launchLoginAction(platform.id, platform.loginUrl!);
        if (result.success) {
          toast.success(`Successfully connected ${platform.name}!`);
        } else {
          toast.error(`Failed to connect: ${result.error}`);
        }
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="rounded-full h-9 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 gap-2">
          <Plus className="w-4 h-4" />
          {isPending ? 'Connecting...' : 'Connect account'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Platforms
        </div>
        {PLATFORMS.map((platform) => (
          <DropdownMenuItem 
            key={platform.id} 
            asChild={!platform.isTierB}
            onClick={() => handleConnect(platform)}
            className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-muted focus:bg-muted transition-colors flex items-center gap-3 w-full"
          >
            {platform.isTierB ? (
              <div>
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <platform.icon className={`w-5 h-5 ${platform.color}`} />
                </div>
                <span className="font-medium text-sm">{platform.name}</span>
              </div>
            ) : (
              <Link href={`/api/auth/connect?platform=${platform.id}`}>
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <platform.icon className={`w-5 h-5 ${platform.color}`} />
                </div>
                <span className="font-medium text-sm">{platform.name}</span>
              </Link>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
