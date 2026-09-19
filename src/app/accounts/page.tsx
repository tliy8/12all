import { db } from '@/lib/database';
import { ConnectDropdown } from '@/components/accounts/connect-dropdown';
import { ConnectionCard } from '@/components/accounts/connection-card';
import { Link2Off } from 'lucide-react';

async function getConnectedAccounts() {
  const { data: accounts, error } = await db
    .from('platform_credentials')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  return accounts || [];
}

export default async function AccountsPage() {
  const accounts = await getConnectedAccounts();

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-background p-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage the social profiles and platforms where your content will be published.
          </p>
        </div>
        
        <ConnectDropdown />
      </div>

      {/* Grid of Accounts */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border/50 bg-muted/10">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Link2Off className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No accounts connected</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            You haven't connected any platforms yet. Add an account to start publishing content.
          </p>
          <ConnectDropdown />
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {accounts.length} connected
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <ConnectionCard
                key={account.id}
                id={account.id}
                platform={account.platform_name}
                metadata={account.metadata}
                isActive={account.is_active}
                updatedAt={account.updated_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
