import { ExternalLink, BookOpen, Video, FileText, MonitorPlay } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';

interface TopicResourcesSectionProps {
    resources?: string[] | undefined;
    title?: string;
    description?: string;
    className?: string; // Additional classes
}

export function TopicResourcesSection({
    resources,
    title = "Recommended Resources",
    description = "Curated materials to master this topic",
    className
}: TopicResourcesSectionProps) {
    if (!resources || resources.length === 0) {
        return null;
    }

    // Helper to parse URL into readable title and domain
    const parseResource = (url: string) => {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');

            // Derive title from path
            // e.g. /sql-tutorial/sql-pivot-table -> SQL Pivot Table
            const pathSegments = urlObj.pathname.split('/').filter(Boolean);
            const slug = pathSegments[pathSegments.length - 1] || domain;

            const title = slug
                .split(/[-_]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            // Determine icon based on domain or extension
            let Icon = ExternalLink;

            if (domain.includes('youtube') || domain.includes('vimeo')) {
                Icon = Video;
            } else if (url.endsWith('.pdf')) {
                Icon = FileText;
            } else if (domain.includes('datalemur') || domain.includes('leetcode') || domain.includes('hackerrank')) {
                Icon = MonitorPlay;
            } else if (domain.includes('medium') || domain.includes('dev.to') || domain.includes('blog')) {
                Icon = BookOpen;
            }

            return { title, domain, Icon };
        } catch (e) {
            return { title: url, domain: 'External Link', Icon: ExternalLink };
        }
    };

    return (
        <div className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100", className)}>
            {title && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="text-sm text-slate-500">{description}</p>
                    </div>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((url, idx) => {
                    const { title, domain, Icon } = parseResource(url);

                    return (
                        <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                        >
                            <Card className="h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-slate-200 hover:border-blue-300/50 bg-white group-hover:ring-2 group-hover:ring-blue-100/50">
                                <CardContent className="p-5 flex items-start gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h4 className="font-semibold text-base text-slate-900 group-hover:text-blue-700 truncate transition-colors leading-tight">
                                            {title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{domain}</span>
                                        </div>
                                    </div>

                                    <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
                                </CardContent>
                            </Card>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
