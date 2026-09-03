'use client';

import dynamic from 'next/dynamic';

const DashboardMain = dynamic(
  () => import('@/components/dashboard/DashboardMain'),
  {
    ssr: false,
    loading: () => (
      <div 
        suppressHydrationWarning
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070a12]"
      >
        <div 
          suppressHydrationWarning
          className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" 
        />
      </div>
    ),
  }
);

export default function Page() {
  return <DashboardMain />;
}
