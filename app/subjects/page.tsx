'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Target, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SubjectsSkeleton } from '@/components/skeletons';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { SyllabusSubject } from '@/types/exam';

import { logError } from '@/lib/utils/logger';

// Skeleton component imported from @/components/skeletons

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSyllabus = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const data = await getSyllabus(user.uid);
      setSyllabus(data);
    } catch (error) {
      logError('Error loading syllabus', error as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />

        <PageTransition>
          <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-6">
            <FeaturePageHeader
              title="Study Arsenal"
              description="Master every topic with strategic insights"
              icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
              actions={
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSyllabus}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              }
            />

            {loading ? (
              <SubjectsSkeleton />
            ) : syllabus.length === 0 ? (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="max-w-2xl mx-auto">
                  <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <CardContent className="pt-6 text-center">
                      <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-indigo-900 mb-2">Ready to Study?</h3>
                      <p className="text-sm text-indigo-700 mb-4">Choose your path to learning excellence</p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => router.push('/syllabus')}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Syllabus
                        </Button>
                        <Button
                          onClick={() => router.push('/test')}
                          variant="outline"
                          className="border-indigo-300"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Take Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Empty State */}
                <EmptyState
                  icon={BookOpen}
                  title="No subjects found"
                  description="Complete your onboarding to set up your syllabus, or add subjects manually."
                  action={
                    <Button onClick={() => router.push('/syllabus')}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Go to Syllabus
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="max-w-2xl mx-auto">
                  <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <CardContent className="pt-6 text-center">
                      <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-indigo-900 mb-2">Ready to Study?</h3>
                      <p className="text-sm text-indigo-700 mb-4">Choose your path to learning excellence</p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => router.push('/syllabus')}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Syllabus
                        </Button>
                        <Button
                          onClick={() => router.push('/test')}
                          variant="outline"
                          className="border-indigo-300"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Take Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subjects Grid - Simple layout without tier grouping */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {syllabus.map(subject => (
                    <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        <CardDescription>{subject.topics?.length || 0} topics to master</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {subject.topics?.slice(0, 3).map(topic => (
                              <Badge key={topic.id} variant="outline" className="text-xs">
                                {topic.name}
                              </Badge>
                            ))}
                            {(subject.topics?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(subject.topics?.length || 0) - 3} more
                              </Badge>
                            )}
                          </div>

                          <Link href={`/syllabus`}>
                            <Button className="w-full mt-3 group">
                              <span>Explore Topics</span>
                              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
