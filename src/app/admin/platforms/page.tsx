'use client';

import { useState, useEffect } from 'react';
import { launchLoginAction, getPlatformStatuses, validatePlatformSessionAction } from './actions';
import { runDbDiagnostic } from './diagnostic-action';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Key, Link as LinkIcon, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

const TIER_B_PLATFORMS = [
  { id: 'douyin', name: 'Douyin', loginUrl: 'https://creator.douyin.com/' },
  { id: 'rednote', name: 'Xiaohongshu / Rednote', loginUrl: 'https://creator.rednote.com/' },
  { id: 'tiktok', name: 'TikTok', loginUrl: 'https://www.tiktok.com/login' },
];

export default function PlatformAdminPage() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchStatuses = async () => {
    const result = await getPlatformStatuses();
    if (result.success) {
      setStatuses(result.platforms);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleDiagnostic = async () => {
    setIsDiagnosing(true);
    toast.loading('Running database diagnostics...');
    const result = await runDbDiagnostic();
    setIsDiagnosing(false);
    toast.dismiss();

    if (result.upsert) {
      toast.success('DB Connection & RLS Bypass verified! You can now connect platforms.');
      fetchStatuses();
    } else {
      toast.error(`Diagnostic Failed: ${result.error || 'Check server logs'}`);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    setValidatingId(id);
    toast.loading(`Verifying ${name} session...`);
    const result = await validatePlatformSessionAction(id);
    setValidatingId(null);
    toast.dismiss();

    if (result.success) {
      if (result.isValid) {
        toast.success(`${name} session is VALID and ready for publishing!`);
      } else {
        toast.error(`${name} session has EXPIRED. Please refresh login.`);
      }
      fetchStatuses();
    } else {
      toast.error(`Verification error: ${result.error}`);
    }
  };

  const handleConnect = async (id: string, name: string, url: string) => {
    toast.info(`Launching ${name} login window. After logging in, the browser should close automatically. If it doesn't, CLOSE it manually.`);
    setIsRefreshing(true);
    const result = await launchLoginAction(id, url);
    setIsRefreshing(false);

    if (result.success) {
      toast.success(`${name} connected and session saved!`);
      fetchStatuses();
    } else {
      toast.error(`Failed to connect ${name}: ${result.error}`);
    }
  };

  const getStatusInfo = (id: string) => {
    const cred = statuses.find(s => s.platform_name === id);
    if (!cred) return { label: 'Not Connected', variant: 'secondary' as const, icon: XCircle, lastSync: null };

    return { 
      label: cred.is_active ? 'Connected' : 'Expired/Invalid', 
      variant: cred.is_active ? 'default' as const : 'destructive' as const,
      icon: cred.is_active ? CheckCircle2 : AlertTriangle,
      lastSync: cred.updated_at
    };
  };

  return (
    <div className="container py-10 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground">Manage connections and session states for all platforms.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchStatuses}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDiagnostic} 
          disabled={isDiagnosing}
          className="text-xs"
        >
          <Activity className="w-3 h-3 mr-2" />
          {isDiagnosing ? 'Testing...' : 'Run DB Diagnostics'}
        </Button>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-amber-500 text-lg font-semibold">Local Environment Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            "In-App Login" launches a real browser window on your computer. This feature is for **local development and session capturing only**.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Tier B: Browser Automation</span>
            </CardTitle>
            <CardDescription>Direct browser session capture (No API keys needed).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TIER_B_PLATFORMS.map((p) => {
              const status = getStatusInfo(p.id);
              const StatusIcon = status.icon;
              const isConnected = !!status.lastSync;

              return (
                <div key={p.id} className="flex flex-col p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <Badge variant={status.variant} className="flex items-center space-x-1">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Last Sync</span>
                      <span className="text-xs font-mono">
                        {status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {isConnected && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVerify(p.id, p.name)}
                          disabled={validatingId === p.id}
                        >
                          <ShieldCheck className={`w-4 h-4 mr-1 ${validatingId === p.id ? 'animate-pulse' : ''}`} />
                          Verify
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleConnect(p.id, p.name, p.loginUrl)}
                        disabled={isRefreshing}
                      >
                        {status.lastSync ? 'Refresh Session' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="opacity-60 grayscale pointer-events-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5" />
              <span>Tier A: Official APIs</span>
            </CardTitle>
            <CardDescription>OAuth 2.0 flows (Requires ngrok setup).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center py-8 italic text-muted-foreground">Integrating in next sub-phase...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple Icon fallback
function Smartphone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  )
}

