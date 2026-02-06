'use client';

import {
  TrendingUp,
  ChevronLeft,
  AlertTriangle,
  Zap,
  BarChart2,
  Activity,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,

} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { getAllProgress, getSyllabus, getUser } from '@/lib/firebase/firebase-utils';
import { calculateStrategyMetrics, formatVelocity, getStatusColor, getStatusLabel } from '@/lib/strategy-utils';
import { TopicProgress, SyllabusSubject } from '@/types/exam';

export default function StrategyPage() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [profileData, syllabusData, progressData] = await Promise.all([
          getUser(user.uid),
          getSyllabus(user.uid, activeCourseId ?? undefined),
          getAllProgress(user.uid, activeCourseId ?? undefined),
        ]);

        if (syllabusData) setSyllabus(syllabusData);
        if (progressData) setProgress(progressData);
        if (profileData) setUserProfile(profileData);
      } catch (error) {
        console.error('Error fetching strategy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, activeCourseId]);

  const completedTopicsCount = progress.filter(p => p.status === 'completed' || p.status === 'mastered').length;

  const metrics = useMemo(() => {
    if (!userProfile) return null;
    
    // Create Map for V2 calculations
    const progressMap = new Map<string, TopicProgress>();
    progress.forEach(p => progressMap.set(p.topicId, p));

    return calculateStrategyMetrics(userProfile, syllabus, completedTopicsCount, progressMap);
  }, [userProfile, syllabus, completedTopicsCount, progress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <div className="max-w-4xl mx-auto p-6 pt-24 text-center">
            <h2 className="text-xl font-semibold mb-4">Configuration Required</h2>
            <p className="text-muted-foreground mb-6">Please set your preparation start date to view strategy insights.</p>
            <Button asChild>
              <Link href="/profile">Go to Settings</Link>
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // === CHART DATA PREPARATION ===

  // 1. Velocity Chart
  const velocityChartData = [
    {
      name: 'Current',
      value: metrics.currentVelocity * 7, // Weekly
      color: '#3b82f6', // blue-500
    },
    {
      name: 'Target',
      value: metrics.requiredVelocity * 7, // Weekly
      color: metrics.currentVelocity >= metrics.requiredVelocity ? '#10b981' : '#f59e0b', // emerald vs amber
    },
  ];

  // 2. Learning Pipeline Stats
  let pipelineStats = {
    discovery: 0,
    inFlow: 0,
    polishing: 0,
    mastered: 0
  };

  const progressMapLocal = new Map<string, TopicProgress>();
  progress.forEach(p => progressMapLocal.set(p.topicId, p));

  syllabus.forEach(subject => {
     subject.topics.forEach(topic => {
        const p = progressMapLocal.get(topic.id);
        if (!p) {
           pipelineStats.discovery++;
        } else if (p.status === 'completed' && (p.masteryScore || 0) >= 80) {
           pipelineStats.mastered++;
        } else if (p.status === 'completed') {
           pipelineStats.polishing++;
        } else {
           pipelineStats.inFlow++;
        }
     });
  });


  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navigation />
        <BottomNav />

        <PageTransition>
          <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
             {/* Header */}
            <div className="space-y-4">
               <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-blue-600 transition-colors">
                  <Link href="/syllabus">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Syllabus
                  </Link>
                </Button>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    Strategy Command Center
                  </h1>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${getStatusColor(
                    metrics.status
                  )}`}
                >
                  {getStatusLabel(metrics.status)}
                </div>
              </div>
            </div>

            {/* Main Status Alerts */}
            {metrics.status === 'critical' && (
              <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Critical Action Required</AlertTitle>
                <AlertDescription className="text-rose-700 mt-1">
                  You are falling behind schedule. Increase your velocity by <span className="font-bold underline">{formatVelocity(metrics.requiredVelocity - metrics.currentVelocity)} topics/week</span> to catch up.
                </AlertDescription>
              </Alert>
            )}

            {metrics.status === 'ahead' && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm">
                <Zap className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="text-emerald-800">Excellent Momentum</AlertTitle>
                <AlertDescription className="text-emerald-700 mt-1">
                  You are tracking <span className="font-bold">{Math.floor(metrics.daysRemaining / 7)} weeks ahead</span> of schedule.
                </AlertDescription>
              </Alert>
            )}

            {/* Top Analysis Cluster: Velocity & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Velocity Analysis (Keep Chart as it's high value) */}
                <Card className="lg:col-span-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/20 shadow-sm">
                   <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                         <div>
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                               <BarChart2 className="h-5 w-5 text-blue-500" />
                               Velocity Analysis
                            </CardTitle>
                            <CardDescription>Average topics completed per week</CardDescription>
                         </div>
                         <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{formatVelocity(metrics.currentVelocity)}</div>
                            <div className="text-xs text-muted-foreground uppercase font-medium">Current Pace</div>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={velocityChartData} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip
                               cursor={{ fill: 'transparent' }}
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" barSize={32} radius={[0, 6, 6, 0]}>
                               {velocityChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </CardContent>
                </Card>

                {/* 2. Timeline & Stats */}
                <div className="space-y-4">
                   <Card className="shadow-sm border-indigo-100">
                      <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/50">
                         <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Timeline
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                         <div className="flex justify-between items-center">
                            <div>
                               <div className="text-2xl font-bold text-gray-900">
                                  {metrics.daysRemaining}
                               </div>
                               <div className="text-xs text-gray-500 font-medium">Days Remaining</div>
                            </div>
                            <div className="text-right">
                               <div className="text-2xl font-bold text-indigo-600">
                                  {metrics.totalTopics}
                               </div>
                               <div className="text-xs text-gray-500 font-medium">Total Topics</div>
                            </div>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                            <span className="text-muted-foreground">Est. Finish:</span>
                            <span className="font-semibold text-gray-900">
                               {metrics.projectedFinishDate.toLocaleDateString(undefined, {
                                  month: 'short', day: 'numeric', year: 'numeric'
                               })}
                            </span>
                         </div>
                      </CardContent>
                   </Card>
                </div>
            </div>

            {/* Middle Row: Learning Pipeline */}
            <section>
               <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold text-lg">
                  <Filter className="h-5 w-5 text-indigo-600" />
                  Learning Pipeline
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PipelineCard 
                     label="Discovery" 
                     count={pipelineStats.discovery} 
                     color="bg-white border-gray-200 text-gray-600 shadow-sm"
                     icon={<BookOpen className="w-5 h-5 mb-1 opacity-70" />}
                     desc="Not Started"
                  />
                  <PipelineCard 
                     label="In Flow" 
                     count={pipelineStats.inFlow} 
                     color="bg-white border-blue-200 text-blue-600 shadow-sm ring-1 ring-blue-50" 
                     icon={<Activity className="w-5 h-5 mb-1 opacity-70" />}
                     desc="Active Study"
                  />
                  <PipelineCard 
                     label="Polishing" 
                     count={pipelineStats.polishing} 
                     color="bg-white border-amber-200 text-amber-600 shadow-sm ring-1 ring-amber-50" 
                     icon={<AlertTriangle className="w-5 h-5 mb-1 opacity-70" />}
                     desc="Needs Review"
                  />
                  <PipelineCard 
                     label="Locked" 
                     count={pipelineStats.mastered} 
                     color="bg-white border-emerald-200 text-emerald-600 shadow-sm ring-1 ring-emerald-50" 
                     icon={<CheckCircle2 className="w-5 h-5 mb-1 opacity-70" />}
                     desc="Mastered (80%+)"
                  />
               </div>
            </section>

             {/* Bottom Row: Detailed Subject Breakdown (Replaces Matrix) */}
             <section>
                <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold text-lg">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Subject Performance Breakdown
                </div>
                <Card className="overflow-hidden shadow-sm border border-gray-200">
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                               <th className="px-6 py-3 font-medium">Subject</th>
                               <th className="px-6 py-3 font-medium text-center">Coverage</th>
                               <th className="px-6 py-3 font-medium text-center">Mastery Score</th>
                               <th className="px-6 py-3 font-medium text-center">Effort</th>
                               <th className="px-6 py-3 font-medium text-right">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                            {metrics.subjectMetrics.map((subject) => (
                               <tr key={subject.name} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-gray-900">
                                     {subject.name}
                                     <div className="text-xs text-muted-foreground font-normal mt-0.5">{subject.totalTopics} topics</div>
                                  </td>
                                  <td className="px-6 py-4 max-w-[140px]">
                                     <div className="space-y-1.5 flex flex-col items-center">
                                       <span className="text-xs font-semibold">{Math.round(subject.completionPercentage)}%</span>
                                       <Progress value={subject.completionPercentage} className="h-2 w-full bg-slate-100" />
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     <Badge variant="outline" className={`
                                        ${subject.masteryScoreAvg >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                          subject.masteryScoreAvg >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          'bg-slate-100 text-slate-600 border-slate-200'}
                                     `}>
                                        {Math.round(subject.masteryScoreAvg)}%
                                     </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     <div className="font-medium text-gray-900">{subject.totalStudyHours.toFixed(1)}h</div>
                                     <div className="text-[10px] text-muted-foreground">invested</div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <Badge variant="secondary" className="font-normal">
                                       {subject.completionPercentage === 100 ? 'Completed' : 
                                         subject.completionPercentage > 0 ? 'In Progress' : 'Not Started'}
                                    </Badge>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </Card>
             </section>

          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}

function PipelineCard({ label, count, color, icon, desc }: { label: string, count: number, color: string, icon: React.ReactNode, desc: string }) {
   return (
      <div className={`p-5 rounded-xl border ${color} flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-default`}>
         {icon}
         <div className="text-3xl font-bold mb-1 tracking-tight">{count}</div>
         <div className="font-semibold text-sm mb-1">{label}</div>
         <div className="text-[10px] opacity-70 uppercase tracking-wide font-medium">{desc}</div>
      </div>
   )
}
