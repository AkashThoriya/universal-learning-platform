'use client';

import { motion } from 'framer-motion';
import { Calendar, Target, CheckCircle2, TrendingUp, Trash2, Play, Pause, Trophy, Edit } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { EditJourneyDialog } from '@/components/journey/EditJourneyDialog';
import PageContainer from '@/components/layout/PageContainer';
import { DetailPageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { journeyService } from '@/lib/services/journey-service';
import { UserJourney } from '@/types/journey';

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const journeyId = params.id as string;

  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!user || !journeyId) {
      return;
    }

    // Subscribe to real-time updates for this journey
    const unsubscribe = journeyService.subscribeToUserJourneys(user.uid, journeys => {
      const found = journeys.find(j => j.id === journeyId);
      setJourney(found || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, journeyId]);

  const handleStatusChange = async (newStatus: UserJourney['status']) => {
    if (!journey) {
      return;
    }

    try {
      await journeyService.updateJourneyStatus(journey.id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Journey status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update journey status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!journey) {
      return;
    }

    try {
      await journeyService.updateJourneyStatus(journey.id, 'cancelled');
      toast({
        title: 'Journey Cancelled',
        description: 'Your journey has been cancelled successfully.',
      });
      router.push('/journey');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel journey',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: UserJourney['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: UserJourney['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string | any) => {
    if (!date) {
      return 'Not set';
    }
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = () => {
    if (!journey?.targetCompletionDate) {
      return null;
    }
    const targetDate = journey.targetCompletionDate as any;
    const target = targetDate.toDate ? targetDate.toDate() : new Date(targetDate);
    const days = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <AuthGuard>
        <PageTransition>
          <PageContainer>
            <div className="space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          </PageContainer>
        </PageTransition>
      </AuthGuard>
    );
  }

  if (!journey) {
    return (
      <AuthGuard>
        <PageTransition>
          <PageContainer>
            <EmptyState
              icon={Target}
              title="Journey Not Found"
              description="This journey doesn't exist or you don't have access to it."
              action={<Button onClick={() => router.push('/journey')}>Back to Journeys</Button>}
            />
          </PageContainer>
        </PageTransition>
      </AuthGuard>
    );
  }

  const daysRemaining = getDaysRemaining();
  const overallProgress = journey.progressTracking?.overallCompletion || 0;

  return (
    <AuthGuard>
      <PageTransition>
        <PageContainer className="pb-40">
          {/* Header */}
          <DetailPageHeader
            title={journey.title}
            description={journey.description}
            backHref="/journey"
            backLabel="Journeys"
            actions={
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(journey.status)}>{journey.status}</Badge>
                <Badge variant="outline" className={getPriorityColor(journey.priority)}>
                  {journey.priority}
                </Badge>
              </div>
            }
          />

          {/* Progress Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      <span className="font-semibold text-indigo-900">Overall Progress</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={overallProgress} className="flex-1 h-3" />
                      <span className="text-2xl font-bold text-indigo-600">{overallProgress}%</span>
                    </div>
                  </div>

                  {daysRemaining !== null && (
                    <div className="text-center md:text-right px-4 py-2 bg-white/60 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-900">{daysRemaining}</div>
                      <div className="text-sm text-indigo-600">days remaining</div>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created</span>
                    <div className="font-medium">{formatDate(journey.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Target Date</span>
                    <div className="font-medium">{formatDate(journey.targetCompletionDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Track</span>
                    <div className="font-medium capitalize">{journey.track}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Goals</span>
                    <div className="font-medium">{journey.customGoals?.length || 0} goals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goals Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Journey Goals
              </CardTitle>
              <CardDescription>Track your progress across all goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {journey.customGoals && journey.customGoals.length > 0 ? (
                journey.customGoals.map((goal, index) => {
                  const completion = journey.progressTracking?.goalCompletions?.[goal.id] || 0;
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                        {completion >= 100 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={completion} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-gray-700">{completion}%</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {formatDate(goal.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {goal.targetValue} {goal.unit}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Target}
                  title="No Goals Yet"
                  description="Add goals to track your progress on this journey."
                />
              )}
            </CardContent>
          </Card>

          {/* Milestones Section */}
          {journey.progressTracking?.milestoneAchievements &&
            journey.progressTracking.milestoneAchievements.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Milestones Achieved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {journey.progressTracking.milestoneAchievements.map((milestone, index) => (
                      <div
                        key={milestone.id || index}
                        className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-900">{milestone.title}</div>
                          <div className="text-sm text-yellow-700">{milestone.celebrationMessage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <EditJourneyDialog
              journey={journey}
              onJourneyUpdated={() => {}}
              trigger={
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Journey
                </Button>
              }
            />
            {journey.status === 'active' && (
              <Button variant="outline" onClick={() => handleStatusChange('paused')} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause Journey
              </Button>
            )}
            {journey.status === 'paused' && (
              <Button onClick={() => handleStatusChange('active')} className="gap-2 bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4" />
                Resume Journey
              </Button>
            )}
            {journey.status === 'active' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </Button>
            )}
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Cancel Journey
            </Button>
          </div>

          {/* Delete Confirmation */}
          <ConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Cancel Journey?"
            description="This will mark the journey as cancelled. You can still view it in your history."
            confirmText="Cancel Journey"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </PageContainer>
      </PageTransition>
    </AuthGuard>
  );
}
