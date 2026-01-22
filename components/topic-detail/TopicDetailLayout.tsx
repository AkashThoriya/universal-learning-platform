import { ReactNode } from 'react';

interface TopicDetailLayoutProps {
  hero: ReactNode;
  content: ReactNode;
  rail: ReactNode;
}

export function TopicDetailLayout({ hero, content, rail }: TopicDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
        
        {/* Full width Hero Section */}
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
          
          {/* Mobile Fallback: Render Rail at bottom */}
          <aside className="block lg:hidden w-full mt-8">
            {rail}
          </aside>
        </div>
      </div>
    </div>
  );
}
