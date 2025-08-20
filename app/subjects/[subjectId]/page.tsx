'use client';

import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SUBJECTS_DATA } from '@/lib/subjects-data';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ExternalLink, ChevronRight, Building2 } from 'lucide-react';

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  
  const subject = SUBJECTS_DATA.find(s => s.subjectId === subjectId);

  if (!subject) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Subject not found</h1>
            <Link href="/subjects">
              <Button>Back to Subjects</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'High Priority';
      case 2: return 'Professional Knowledge';
      case 3: return 'Advanced Topics';
      default: return 'Standard';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/subjects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Button>
            </Link>
          </div>

          {/* Subject Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">{subject.name}</h1>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Badge className={getTierColor(subject.tier)}>
                {getTierLabel(subject.tier)}
              </Badge>
              <span className="text-muted-foreground">
                {subject.topics.length} Topics to Master
              </span>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subject.topics.map((topic, index) => (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Topic {index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {subject.tier === 1 ? 'Core' : subject.tier === 2 ? 'PK' : 'Advanced'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Banking Context Preview */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                    <div className="flex items-start space-x-2">
                      <Building2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">Banking Context</p>
                        <p className="text-sm text-yellow-700 line-clamp-3">
                          {topic.bankingContext}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/topic/${topic.id}?subject=${subject.subjectId}`} className="flex-1">
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
      </div>
    </AuthGuard>
  );
}