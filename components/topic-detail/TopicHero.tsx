import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { SyllabusSubject, SyllabusTopic, TopicProgress } from '@/types/exam';

interface TopicHeroProps {
  topic: SyllabusTopic;
  subject: SyllabusSubject;
  progress: TopicProgress | null;
}

export function TopicHero({ topic, subject, progress }: TopicHeroProps) {
  const masteryScore = progress?.masteryScore || 0;

  // Calculate color based on mastery
  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'text-green-600 ring-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 ring-amber-600 bg-amber-50';
    return 'text-blue-600 ring-blue-600 bg-blue-50';
  };

  const ringColor = getMasteryColor(masteryScore);

  return (
    <div className="relative w-full">
      <div className="space-y-6 py-2">
        {/* Navigation Breadcrumb */}
        <Link
          href="/syllabus"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="p-1 rounded-full group-hover:bg-muted transition-colors mr-1">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Syllabus
        </Link>

        <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
          <div className="space-y-4 flex-1">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 font-medium bg-white/60 backdrop-blur border-blue-100 text-blue-700 hover:bg-white/80 transition-colors"
              >
                {subject.name}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white/40 border-slate-200 text-slate-600">
                Tier {subject.tier}
              </Badge>
              {topic.estimatedHours && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 bg-white/40 border-slate-200 text-slate-600 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {topic.estimatedHours}h
                </Badge>
              )}
              {topic.practiceQuestions && topic.practiceQuestions.length > 0 && (
                <Badge variant="outline" className="px-3 py-1 bg-white/40 border-green-200 text-green-700">
                  {topic.practiceQuestions.length} Problems
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
              {topic.name}
            </h1>

            {/* Description (Optional - can be in hero or overview tab) */}
            {/* Keeping it simple here, moving detailed description to overview */}
          </div>

          {/* Mastery Ring Indicator */}
          <div className="flex-shrink-0 flex items-center md:flex-col gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}%`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - masteryScore / 100)}%`}
                  className={`${ringColor.split(' ')[0]} transition-all duration-1000 ease-out`}
                  style={{ strokeDasharray: '283%', strokeDashoffset: `${283 * (1 - masteryScore / 100)}%` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-sm md:text-base font-bold ${ringColor.split(' ')[0]}`}>
                  {Math.round(masteryScore)}%
                </span>
              </div>
            </div>
            <div className="text-left md:text-center">
              <div className="text-sm font-semibold text-slate-700">Mastery Level</div>
              <div className="text-xs text-slate-500">Keep practicing to improve</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
