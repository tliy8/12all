'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusSquare, Share2, Settings, User, Bell, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'History',
    href: '/posts',
    icon: History,
  },
  {
    name: 'Platforms',
    href: '/admin/platforms',
    icon: Share2,
  },
  {
    name: 'New Post',
    href: '/posts/new',
    icon: PlusSquare,
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="bg-primary p-1.5 rounded-lg group-hover:rotate-6 transition-transform">
                <PlusSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                One2O
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-all rounded-md flex items-center gap-2 group",
                    pathname === item.href 
                      ? "text-foreground bg-accent/50" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110",
                    pathname === item.href ? "text-primary" : ""
                  )} />
                  {item.name}
                  {pathname === item.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium hidden lg:inline-block">Admin</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
