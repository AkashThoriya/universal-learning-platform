'use client';

import { BookOpen, Target, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBJECTS_DATA } from '@/lib/data/subjects-data';

export default function SubjectsPage() {
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />

        <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Study Arsenal</h1>
            <p className="text-muted-foreground">Master every topic with banking context and strategic insights</p>
          </div>

          {/* Quick Actions */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-indigo-900 mb-2">Ready to Study?</h3>
                <p className="text-sm text-indigo-700 mb-4">Choose your path to learning excellence</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => (window.location.href = '/syllabus')}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Syllabus
                  </Button>
                  <Button
                    onClick={() => (window.location.href = '/test')}
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

          {/* Tier Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-900">Tier 1: Core Subjects</h3>
                <p className="text-sm text-red-700">Aptitude, Reasoning, English</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900">Tier 2: Professional Knowledge</h3>
                <p className="text-sm text-blue-700">DBMS, Networks, OS, etc.</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">Tier 3: Advanced</h3>
                <p className="text-sm text-green-700">Specialized banking tech</p>
              </CardContent>
            </Card>
          </div>

          {/* Subjects List */}
          <div className="space-y-6">
            {[1, 2, 3].map(tier => (
              <div key={tier} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
                  Tier {tier}: {getTierLabel(tier)}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SUBJECTS_DATA.filter(subject => subject.tier === tier).map(subject => (
                    <Card key={subject.subjectId} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <Badge className={getTierColor(subject.tier)}>{getTierLabel(subject.tier)}</Badge>
                        </div>
                        <CardDescription>{subject.topics.length} topics to master</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {subject.topics.slice(0, 3).map(topic => (
                              <Badge key={topic.id} variant="outline" className="text-xs">
                                {topic.name}
                              </Badge>
                            ))}
                            {subject.topics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subject.topics.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <Link href={`/subjects/${subject.subjectId}`}>
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
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
