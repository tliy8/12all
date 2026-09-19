'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PlatformPreview } from '@/components/platform-preview';

interface Post {
  id: string;
  master_title: string;
  master_text: string;
  media_urls: string[];
  scheduled_for: string;
  publish_jobs: { platform: string; status: string }[];
}

interface FullCalendarProps {
  initialYear: number;
  initialMonth: number;
  posts: Post[];
}

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function FullCalendar({ initialYear, initialMonth, posts }: FullCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    setCurrentDate(new Date(year, month - 1, 1));
  }, [searchParams]);

  const navigateMonth = (direction: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    router.push(`/calendar?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`);
  };

  const goToToday = () => {
    const today = new Date();
    router.push(`/calendar?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  
  // Padding for previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }

  // Padding for next month to complete the grid (usually up to 35 or 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Group posts by date string (YYYY-MM-DD) in LOCAL timezone
  const postsByDate = posts.reduce((acc, post) => {
    if (!post.scheduled_for) return acc;
    const localDate = new Date(post.scheduled_for);
    const y = localDate.getFullYear();
    const m = String(localDate.getMonth() + 1).padStart(2, '0');
    const d = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handleCellClick = (date: Date, isPast: boolean, hasPosts: boolean) => {
    if (isPast && !hasPosts) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    router.push(`/posts/new?date=${y}-${m}-${d}`);
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#111] text-gray-200 p-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="h-8 px-4 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 ml-2" onClick={goToToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold tracking-tight text-white">{monthName} {year}</h2>
          </div>
        </div>
        
        {/* Placeholder for view toggle (Month/Week) from screenshot */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500 mr-2 text-xs">UTC</span>
          <div className="bg-[#222] rounded-md p-1 border border-white/5 flex">
            <button className="px-4 py-1.5 rounded-sm bg-[#333] text-white shadow-sm font-medium text-xs">Month</button>
            <button className="px-4 py-1.5 rounded-sm text-gray-400 hover:text-white font-medium text-xs">Week</button>
          </div>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-[#161616]">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-[#1a1a1a]">
          {days.map((dayObj, i) => {
            const dateStr = `${dayObj.date.getFullYear()}-${String(dayObj.date.getMonth() + 1).padStart(2, '0')}-${String(dayObj.date.getDate()).padStart(2, '0')}`;
            const dayPosts = postsByDate[dateStr] || [];
            const isCurrentDay = isToday(dayObj.date);
            const isPast = dayObj.date < todayStart;
            const isClickable = !(isPast && dayPosts.length === 0);

            return (
              <div 
                key={i} 
                onClick={() => handleCellClick(dayObj.date, isPast, dayPosts.length > 0)}
                className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-colors relative group
                  ${!dayObj.isCurrentMonth ? 'bg-[#141414]/50' : ''}
                  ${isClickable ? 'cursor-pointer hover:bg-[#222]' : 'cursor-not-allowed'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                    ${isCurrentDay 
                      ? 'bg-[#84cc16] text-[#0f172a] shadow-[0_0_15px_rgba(132,204,22,0.4)]' 
                      : dayObj.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                    }
                  `}>
                    {dayObj.day}
                  </div>
                </div>

                {/* Render Posts for this day */}
                <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                  {dayPosts.map(post => (
                    <div 
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                      }}
                      className="text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-200 rounded-md px-2 py-1.5 cursor-pointer truncate border border-white/5 transition-colors"
                      title={post.master_title || post.master_text}
                    >
                      {post.master_title || post.master_text.substring(0, 20) + '...'}
                      <div className="flex gap-1 mt-1">
                         {post.publish_jobs?.map((j, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${j.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                         ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Preview Modal */}
      {selectedPost && (
        <PlatformPreview
          platformId="douyin" // We just need a default view to see it
          platformName="Preview"
          title={selectedPost.master_title}
          content={selectedPost.master_text}
          mediaUrls={selectedPost.media_urls}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
