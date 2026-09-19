import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Activity, Plus, Share2, PlusSquare, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RetryButton } from '@/components/retry-button';

async function getDashboardData() {
  const { data: jobs } = await db.from('publish_jobs')
    .select(`
      *,
      posts (
        master_text
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: health } = await db.from('system_health').select('*');

  return { jobs: jobs || [], health: health || [] };
}

export default async function DashboardPage() {
  const { jobs, health } = await getDashboardData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Activity className="w-3 h-3 mr-1 animate-pulse" /> Processing</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="container py-10 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your omnichannel publishing activity.</p>
        </div>
        <Link href="/posts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/posts/new">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
              <PlusSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">New Post</div>
              <p className="text-xs text-muted-foreground">Start a new draft</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/posts">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Post History</div>
              <p className="text-xs text-muted-foreground">View all published content</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/platforms">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Platforms</div>
              <p className="text-xs text-muted-foreground">Check connections</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worker Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {health.length > 0 ? (
              health.map(h => (
                <div key={h.id} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${h.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-mono">{h.component}: {h.status}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No workers active</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>The last 20 publishing attempts across all platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No jobs found yet.</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {job.platform.charAt(0).toUpperCase() + job.platform.slice(1)}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                      {(job.posts as any)?.master_text}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(job.created_at).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {job.status === 'FAILED' && <RetryButton jobId={job.id} />}
                      {getStatusBadge(job.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
