import { ReactNode } from 'react';

interface TopicDetailLayoutProps {
  hero: ReactNode;
  content: ReactNode;
  rail: ReactNode;
}

export function TopicDetailLayout({ hero, content, rail }: TopicDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
        
        {/* Full wwidth Hero Section */}
        <section className="w-full">
          {hero}
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Column (Left) */}
          <main className="lg:col-span-8 w-full min-w-0">
             {/* min-w-0 is critical for flex/grid children overflow */}
             {content}
          </main>

          {/* Stats Rail Column (Right) */}
          <aside className="hidden lg:block lg:col-span-4 w-full">
            {rail}
          </aside>

          {/* Mobile Rail Fallback (could be below content or specific mobile view) */}
          {/* For now, we rely on the Rail being hidden on mobile and key stats shown in Hero or a separate mobile footer if needed. 
              The current design puts primary actions in the Content area for mobile? 
              Actually, the Stats Rail has the "Mark Complete" button. 
              On mobile, we should probably show the Rail BELOW the content or have a sticky footer. 
              Let's show it below content on mobile for now. 
          */}
          <aside className="lg:hidden w-full order-last">
            {rail}
          </aside>

        </div>
      </div>
    </div>
  );
}
