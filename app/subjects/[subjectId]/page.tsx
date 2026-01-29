'use client';

import { motion } from 'framer-motion';
import { ExternalLink, ChevronRight, Building2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { DetailPageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { TopicDetailSkeleton } from '@/components/skeletons/SyllabusSkeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { logError } from '@/lib/utils/logger';
import { SyllabusSubject } from '@/types/exam';

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const subjectId = params.subjectId as string;

  const [subject, setSubject] = useState<SyllabusSubject | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    let isMounted = true;

    try {
      setLoading(true);
      const syllabus = await getSyllabus(user.uid);
      const foundSubject = syllabus.find(s => s.id === subjectId);
      if (isMounted) {
        setSubject(foundSubject || null);
      }
    } catch (error) {
      logError('Error loading subject details', error as Error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [user?.uid, subjectId]);

  useEffect(() => {
    const cleanup = loadData();
    return () => {
      cleanup.then(c => c?.());
    };
  }, [loadData]);

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return 'High Priority';
      case 2:
        return 'Professional Knowledge';
      case 3:
        return 'Advanced Topics';
      default:
        return 'Standard';
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <BottomNav />
          <PageTransition>
            <TopicDetailSkeleton />
          </PageTransition>
        </div>
      </AuthGuard>
    );
  }

  if (!subject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center space-y-4 p-6 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800">Subject not found</h1>
            <p className="text-gray-600">The subject you are looking for does not exist or has been removed.</p>
            <Button onClick={() => router.push('/subjects')}>Back to Subjects</Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />
        <PageTransition>
          <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-6">
            <DetailPageHeader
              title={subject.name}
              description={`${getTierLabel(subject.tier)} • ${subject.topics?.length || 0} topics to master`}
              backHref="/subjects"
              backLabel="Subjects"
              actions={
                <div className="flex gap-2">
                  <Badge className={getTierColor(subject.tier)}>{getTierLabel(subject.tier)}</Badge>
                  <Button variant="ghost" size="icon" onClick={loadData} title="Refresh Data">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              }
            />

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subject.topics?.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{topic.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Topic {index + 1}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      {/* Banking Context Preview */}
                      {topic.description && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-auto">
                          <div className="flex items-start space-x-2">
                            <Building2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800 mb-1">Context</p>
                              <p className="text-sm text-yellow-700 line-clamp-3">{topic.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-4 pt-2">
                        <Link href={`/topic/${topic.id}?subject=${subject.id}`} className="flex-1">
                          <Button className="w-full group">
                            <span>Study Topic</span>
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Study Strategy */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Strategic Approach for {subject.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">Phase 1: Foundation</h4>
                    <p className="text-blue-800">Build core concepts and identify knowledge gaps</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">Phase 2: Application</h4>
                    <p className="text-blue-800">Connect topics to banking scenarios and practice</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">Phase 3: Mastery</h4>
                    <p className="text-blue-800">Speed practice and mock test performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
