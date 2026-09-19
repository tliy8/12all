'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

interface PostFiltersProps {
  initialStatus: string;
  initialQuery: string;
  counts: {
    all: number;
    scheduled: number;
    drafts: number;
    published: number;
    missed: number;
  };
}

export function PostFilters({ initialStatus, initialQuery, counts }: PostFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);

  // Sync state if URL changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const updateFilters = (updates: { status?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.status !== undefined) {
      if (updates.status === 'all') params.delete('status');
      else params.set('status', updates.status);
    }
    
    if (updates.q !== undefined) {
      if (!updates.q) params.delete('q');
      else params.set('q', updates.q);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query !== (searchParams.get('q') || '')) {
        updateFilters({ q: query });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className={`transition-opacity ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
          <h1 className="text-2xl font-bold">Posts</h1>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search posts..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-card border-none rounded-full focus-visible:ring-1 focus-visible:ring-primary h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="rounded-full h-9 px-4 gap-2 border-border/50 bg-card hover:bg-card/80 shrink-0">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        
        <Button onClick={() => router.push('/posts/new')} className="rounded-full h-9 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          New post
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={initialStatus} onValueChange={(val) => updateFilters({ status: val })} className="w-full">
        <TabsList className="bg-transparent border-b border-border/50 w-full justify-start rounded-none p-0 h-auto gap-6 mb-6 overflow-x-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap">
            All <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap">
            Scheduled <Badge variant="secondary" className="ml-2 bg-transparent">{counts.scheduled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap">
            Drafts <Badge variant="secondary" className="ml-2 bg-transparent">{counts.drafts}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap">
            Published <Badge variant="secondary" className="ml-2 bg-transparent">{counts.published}</Badge>
          </TabsTrigger>
          <TabsTrigger value="missed" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-medium data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap">
            Missed <Badge variant="secondary" className="ml-2 bg-transparent">{counts.missed}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
