'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveFacebookTokenAction } from './actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function FacebookConnectPage() {
  const [token, setToken] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSaveToken = async () => {
    if (!token.trim()) {
      toast.error('Please enter a valid access token.');
      return;
    }

    setIsPending(true);
    try {
      const result = await saveFacebookTokenAction(token.trim());
      if (result.success) {
        toast.success('Facebook connected successfully!');
        router.push('/');
      } else {
        toast.error(`Failed to save token: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg font-bold text-xl">
            f
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Connect Facebook</h1>
            <p className="text-muted-foreground mt-1">
              Connect your Facebook Pages securely using a Permanent Page Access Token.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <Card className="border-border bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Setup Wizard</CardTitle>
            <CardDescription>
              Follow these three steps in the Meta Developer portal to generate your free, permanent token. No app review required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="step1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
                <TabsTrigger value="step1">1. Create App</TabsTrigger>
                <TabsTrigger value="step2">2. User Token</TabsTrigger>
                <TabsTrigger value="step3">3. Page Token</TabsTrigger>
              </TabsList>

              <TabsContent value="step1" className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>1. Go to <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1 font-medium">developers.facebook.com <ExternalLink className="w-3 h-3" /></a> and log in.</p>
                <p>2. In the top right corner, click <strong>My Apps</strong>.</p>
                <p>3. Click the green <strong>Create App</strong> button.</p>
                <p>4. When asked what your app does, select <strong>Other</strong> and click Next.</p>
                <p>5. Select <strong>Business</strong> as the app type and click Next.</p>
                <p>6. Name your app (e.g., <code>one2o Publisher</code>) and click <strong>Create App</strong>.</p>
              </TabsContent>

              <TabsContent value="step2" className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>1. In the top menu bar, click <strong>Tools</strong> {'>'} <strong>Graph API Explorer</strong>.</p>
                <p>2. On the right side panel, ensure your new app is selected in the <strong>Meta App</strong> dropdown.</p>
                <p>3. Under the <strong>Permissions</strong> section, click "Add a Permission" and add: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">pages_show_list</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">pages_read_engagement</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">pages_manage_posts</code>.</p>
                <p>4. Click the blue <strong>Generate Access Token</strong> button.</p>
                <p>5. A popup will ask you to log into Facebook. Continue and select the Facebook Pages you want one2o to manage.</p>
              </TabsContent>

              <TabsContent value="step3" className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>1. Click the small <strong>(i)</strong> icon inside the access token input field.</p>
                <p>2. Click the blue <strong>Open in Access Token Tool</strong> button.</p>
                <p>3. Scroll to the bottom and click <strong>Extend Access Token</strong> (gives you a 60-day token). Copy it.</p>
                <p>4. <strong>CRITICAL:</strong> You must now leave this page and go back to the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-medium">Graph API Explorer</a> tool.</p>
                <p>5. Paste your new 60-day token into the Access Token field.</p>
                <p>6. In the main URL bar (next to the GET button), type exactly: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">me/accounts</code> and click Submit.</p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-2">
                  <p className="font-semibold text-primary mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Your Final Token
                  </p>
                  <p>In the JSON response window below, find your Facebook Page. Copy the <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">access_token</code> field next to it. Paste it below.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="border-border shadow-sm border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Save Access Token
            </CardTitle>
            <CardDescription>
              Your token will be encrypted using AES-256-GCM before being stored in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              type="password" 
              placeholder="EAAGm0PX4ZC... (Paste your Permanent Page Access Token here)" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button 
              onClick={handleSaveToken} 
              disabled={isPending || !token.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {isPending ? 'Encrypting...' : 'Save Token'}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
