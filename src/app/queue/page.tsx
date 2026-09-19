import { getQueueJobsAction } from './actions';
import { QueueClientPage } from './client-page';
import { AlertCircle } from 'lucide-react';
export default async function QueuePage() {
  const result = await getQueueJobsAction();
  
  if (!result.success) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h4 className="font-semibold">Error fetching queue jobs</h4>
            <p className="text-sm opacity-90">{result.error || "An unknown error occurred."}</p>
          </div>
        </div>
      </div>
    );
  }

  return <QueueClientPage initialJobs={result.data || []} />;
}
