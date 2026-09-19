'use client';

import { useState } from 'react';
import { RefreshCcw, XCircle, AlertCircle, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { retryPublishJobAction } from '@/app/posts/actions';
import { cancelJobAction } from './actions';

export function QueueClientPage({ initialJobs }: { initialJobs: any[] }) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const normalizedJobs = initialJobs.map(job => ({
    ...job,
    normalizedStatus: job.status?.toUpperCase() || 'UNKNOWN'
  }));

  const pendingCount = normalizedJobs.filter(j => j.normalizedStatus === 'PENDING').length;
  const failedCount = normalizedJobs.filter(j => j.normalizedStatus === 'FAILED' || j.normalizedStatus === 'ERROR').length;
  const processingCount = normalizedJobs.filter(j => j.normalizedStatus === 'PROCESSING' || j.normalizedStatus === 'IN_PROGRESS').length;

  const handleRetry = async (jobId: string) => {
    setIsProcessing(jobId);
    const res = await retryPublishJobAction(jobId);
    if (res.success) toast.success("Job moved to pending");
    else toast.error("Failed to retry job");
    setIsProcessing(null);
  };

  const handleCancel = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this job? It will be deleted from the queue.")) return;
    setIsProcessing(jobId);
    const res = await cancelJobAction(jobId);
    if (res.success) toast.success("Job cancelled");
    else toast.error("Failed to cancel job");
    setIsProcessing(null);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    if (s === 'PUBLISHED' || s === 'SUCCESS' || s === 'SUCCESSFUL') {
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Published</Badge>;
    }
    if (s === 'PENDING') {
      return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shadow-none border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
    if (s === 'FAILED' || s === 'ERROR') {
      return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
    if (s === 'PROCESSING' || s === 'IN_PROGRESS') {
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-blue-500/20"><PlayCircle className="w-3 h-3 mr-1 animate-pulse" /> Processing</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const JobTable = ({ filterStatus }: { filterStatus?: 'PENDING' | 'PROCESSING' | 'FAILED' | 'PUBLISHED' }) => {
    const jobs = filterStatus ? normalizedJobs.filter(j => {
      if (filterStatus === 'PUBLISHED') return j.normalizedStatus === 'PUBLISHED' || j.normalizedStatus === 'SUCCESS' || j.normalizedStatus === 'SUCCESSFUL';
      if (filterStatus === 'FAILED') return j.normalizedStatus === 'FAILED' || j.normalizedStatus === 'ERROR';
      if (filterStatus === 'PROCESSING') return j.normalizedStatus === 'PROCESSING' || j.normalizedStatus === 'IN_PROGRESS';
      if (filterStatus === 'PENDING') return j.normalizedStatus === 'PENDING';
      return true;
    }) : normalizedJobs;

    if (jobs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-center border rounded-xl border-dashed bg-card/50">
          <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No jobs found</h3>
          <p className="text-sm text-muted-foreground mt-1">The queue is empty for this filter.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
            <tr>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Post Title</th>
              <th className="px-4 py-3">Scheduled For</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-4 py-4 font-medium capitalize">{job.platform}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  <div className="max-w-[200px] truncate" title={job.posts?.master_title}>
                    {job.posts?.master_title || "Untitled Post"}
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {job.posts?.scheduled_for 
                    ? new Date(job.posts.scheduled_for).toLocaleString() 
                    : "Immediate"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={job.status} />
                  {(job.normalizedStatus === 'FAILED' || job.normalizedStatus === 'ERROR') && job.error_log && (
                     <div className="text-[11px] text-muted-foreground mt-2 max-w-[250px] truncate border-l-2 border-red-500/50 pl-2 py-0.5" title={job.error_log}>
                        {job.error_log}
                     </div>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">{job.attempt_count}/3</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(job.normalizedStatus === 'FAILED' || job.normalizedStatus === 'ERROR' || job.normalizedStatus === 'PENDING') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                        onClick={() => handleRetry(job.id)}
                        disabled={isProcessing === job.id}
                        title="Retry Job"
                      >
                        <RefreshCcw className={`w-4 h-4 ${isProcessing === job.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    {(job.normalizedStatus === 'PENDING' || job.normalizedStatus === 'FAILED' || job.normalizedStatus === 'ERROR') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleCancel(job.id)}
                        disabled={isProcessing === job.id}
                        title="Cancel Job"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage background publishing operations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Pending Jobs</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Processing</CardTitle>
            <PlayCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{processingCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">Failed Jobs</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:text-yellow-500">Pending</TabsTrigger>
            <TabsTrigger value="processing" className="data-[state=active]:text-blue-500">Processing</TabsTrigger>
            <TabsTrigger value="failed" className="data-[state=active]:text-red-500">Failed</TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:text-green-500">Published</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          <JobTable />
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <JobTable filterStatus="PENDING" />
        </TabsContent>
        <TabsContent value="processing" className="mt-0">
          <JobTable filterStatus="PROCESSING" />
        </TabsContent>
        <TabsContent value="failed" className="mt-0">
          <JobTable filterStatus="FAILED" />
        </TabsContent>
        <TabsContent value="published" className="mt-0">
          <JobTable filterStatus="PUBLISHED" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
