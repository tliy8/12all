import Link from 'next/link';
import { db } from '@/lib/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Image as ImageIcon, SearchX, Inbox } from 'lucide-react';
import { PostFilters } from '@/components/posts/post-filters';
import { PostRowActions } from '@/components/posts/post-row-actions';

async function getPostsData(q?: string) {
  let query = db.from('posts').select(`
    *,
    publish_jobs (
      id,
      platform,
      status,
      published_url,
      error_log
    )
  `).order('created_at', { ascending: false });

  if (q) {
    query = query.or(`master_title.ilike.%${q}%,master_text.ilike.%${q}%`);
  }

  const { data: posts, error } = await query;
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return posts || [];
}

export default async function PostsHistoryPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const statusTab = typeof searchParams?.status === 'string' ? searchParams.status : 'all';

  const allPosts = await getPostsData(q);

  // Compute counts based on publish_jobs and scheduled_for
  const counts = {
    all: allPosts.length,
    scheduled: 0,
    drafts: 0,
    published: 0,
    missed: 0,
  };

  const categorizedPosts = allPosts.map(post => {
    const jobs = post.publish_jobs || [];
    let status = 'drafts';
    
    if (jobs.some((j: any) => j.status === 'SUCCESS')) {
      status = 'published';
    } else if (jobs.some((j: any) => j.status === 'FAILED')) {
      status = 'missed';
    } else if (post.scheduled_for && new Date(post.scheduled_for) > new Date()) {
      status = 'scheduled';
    }

    // Increment count
    if (status === 'scheduled') counts.scheduled++;
    if (status === 'drafts') counts.drafts++;
    if (status === 'published') counts.published++;
    if (status === 'missed') counts.missed++;

    return { ...post, computedStatus: status };
  });

  // Filter for the current tab
  const filteredPosts = statusTab === 'all' 
    ? categorizedPosts 
    : categorizedPosts.filter(p => p.computedStatus === statusTab);

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-background p-6">
      
      <PostFilters 
        initialStatus={statusTab} 
        initialQuery={q} 
        counts={counts} 
      />

      <div className="space-y-3 mt-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-xl bg-card/30">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              {q || statusTab !== 'all' ? <SearchX className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-1">
              {q || statusTab !== 'all' ? 'No matching posts' : 'No posts yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {q || statusTab !== 'all' 
                ? 'No posts match your search or filters.' 
                : 'Create your first post to see it here.'}
            </p>
            {(!q && statusTab === 'all') && (
              <Link href="/posts/new">
                <Button className="mt-6 rounded-full px-6">Create Post</Button>
              </Link>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors group shadow-sm">
              <div className="flex-shrink-0 pt-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 ml-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium leading-relaxed truncate max-w-xl">
                      {post.master_title || post.master_text || "Untitled Post"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.publish_jobs?.length ? (
                        post.publish_jobs.map((job: any) => (
                          <Badge key={job.id} variant="outline" className="text-[10px] h-5 px-1.5 capitalize bg-muted/30 text-muted-foreground font-medium border-border/40">
                            {job.platform === 'twitter' ? 'X (Twitter)' : job.platform === 'rednote' ? 'Rednote' : job.platform}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No platforms</span>
                      )}
                      {post.media_urls?.length ? (
                        <span className="flex items-center gap-1 text-muted-foreground/70 ml-2 text-xs">
                          • <ImageIcon className="w-3.5 h-3.5" /> {post.media_urls.length}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <Avatar className="w-8 h-8 border border-border/50 rounded-md bg-muted">
                      <AvatarImage src="" />
                      <AvatarFallback className="rounded-md bg-muted text-xs text-muted-foreground font-medium">U</AvatarFallback>
                    </Avatar>
                    
                    <Badge variant="secondary" className="bg-muted text-muted-foreground capitalize">
                      {post.computedStatus}
                    </Badge>
                    
                    <PostRowActions postId={post.id} status={post.computedStatus} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {filteredPosts.length > 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground font-medium">
            All posts loaded.
          </div>
        )}
      </div>
    </div>
  );
}
