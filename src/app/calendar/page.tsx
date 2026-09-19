import { Suspense } from 'react';
import { getScheduledPostsForMonthAction } from './actions';
import { FullCalendar } from '@/components/calendar/full-calendar';

export default async function CalendarPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  
  const year = searchParams.year ? parseInt(searchParams.year as string) : new Date().getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month as string) : new Date().getMonth() + 1;

  // Fetch posts for the specified month
  const result = await getScheduledPostsForMonthAction(year, month);
  const posts = result.success ? result.data : [];

  return (
    <div className="flex-1 bg-[#111] overflow-hidden">
      <Suspense fallback={<div className="p-10 text-white">Loading calendar...</div>}>
        <FullCalendar 
          initialYear={year} 
          initialMonth={month} 
          posts={posts || []} 
        />
      </Suspense>
    </div>
  );
}
