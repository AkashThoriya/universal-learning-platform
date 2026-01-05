'use client';

import { BarChart3, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AnalyticsErrorState() {
  const router = useRouter();

  const handleRefresh = () => {
    // Attempt to refresh the route data without full reload first
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <BarChart3 className="h-12 w-12 text-red-500 opacity-80" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Temporarily Unavailable</h2>
      
      <p className="text-gray-600 max-w-md mb-8">
        We encountered an issue loading your performance insights. This is likely a temporary glitch.
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
