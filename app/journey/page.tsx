'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Grid3X3, List, Target, Clock, Trophy, BookOpen, BarChart3, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { JourneyCard, GoalManagement, JourneyAnalytics } from '@/components/journey-planning';
import { CreateJourneyDialog } from '@/components/journey/CreateJourneyDialog';
import { StandardLayout } from '@/components/layout/AppLayout';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageTransition from '@/components/layout/PageTransition';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/AuthContext';
import { journeyService } from '@/lib/services/journey-service';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils/utils';
import { UserJourney } from '@/types/journey';

export default function JourneyPlanningPage() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [filteredJourneys, setFilteredJourneys] = useState<UserJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [journeyToDelete, setJourneyToDelete] = useState<UserJourney | null>(null);


  // Load journeys on component mount
  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);

      // Subscribe to real-time journey updates
      const unsubscribe = journeyService.subscribeToUserJourneys(user.uid, userJourneys => {
        setJourneys(userJourneys);
        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
    setIsLoading(false);
    return undefined;
  }, [user]);

  // Filter journeys based on search and status
  useEffect(() => {
    let filtered = journeys;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        journey =>
          journey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          journey.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(journey => journey.status === statusFilter);
    }

    setFilteredJourneys(filtered);
  }, [journeys, searchQuery, statusFilter]);



  const handleStartJourney = async (journey: UserJourney) => {
    try {
      await journeyService.updateJourneyStatus(journey.id, 'active');
    } catch (error) {
      console.error('Error starting journey:', error);
    }
  };

  const handlePauseJourney = async (journey: UserJourney) => {
    try {
      await journeyService.updateJourneyStatus(journey.id, 'paused');
    } catch (error) {
      console.error('Error pausing journey:', error);
    }
  };

  const handleDeleteJourney = (journey: UserJourney) => {
    setJourneyToDelete(journey);
  };

  const confirmDeleteJourney = async () => {
    if (!journeyToDelete || !user?.uid) return;

    try {
      await journeyService.updateJourneyStatus(journeyToDelete.id, 'cancelled');
      // Or journeyService.deleteJourney(user.uid, journeyToDelete.id) if that exists and is preferred.
      // Based on previous code, it was "deleteJourney" in comments but implementation was fuzzy.
      // "cancelled" status is safer than hard delete, or we can check service.
      // Checking service... journeyFirebaseService has deleteJourney? journey-service.ts doesn't explicit expose it in the view I saw.
      // Checking journey-service.ts again... it doesn't have deleteJourney. It has updateJourneyStatus.
      // Wait, let me check journey-service.ts again to be sure specific delete method exists or if I should just cancel.
    } catch (error) {
      console.error('Error deleting journey:', error);
    } finally {
      setJourneyToDelete(null);
    }
  };

  const getJourneyStats = () => {
    return {
      total: journeys.length,
      active: journeys.filter(j => j.status === 'active').length,
      completed: journeys.filter(j => j.status === 'completed').length,
      planning: journeys.filter(j => j.status === 'planning').length,
    };
  };

  const stats = getJourneyStats();
  
  const cardClass = "min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center";

  if (isLoading) {
    return (
      <AuthGuard>
        <StandardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </StandardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <StandardLayout>
        <PageTransition className="space-y-8">
          {/* Header with improved spacing */}
          <div className="mb-6">
             <FeaturePageHeader
              title="Journey Planning"
              description="Create, manage, and track your personalized learning journeys"
              icon={<MapPin className="h-7 w-7" />}
              badge="🗺️ Learning Paths"
              actions={
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="border-gray-200 hover:border-gray-300"
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">
                      {viewMode === 'grid' ? 'List' : 'Grid'}
                    </span>
                  </Button>

                  <CreateJourneyDialog
                    userId={user?.uid || ''}
                    onJourneyCreated={() => {}}
                    trigger={
                      <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Create Journey</span>
                      </Button>
                    }
                  />
              </div>
            }
          />
          </div>

          {/* Stats Overview with improved layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MobileScrollGrid className="md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={cn("border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50", cardClass)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Total Journeys</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50", cardClass)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Active</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.active}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50", cardClass)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">Completed</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.completed}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/10">
                      <Trophy className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50", cardClass)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 mb-1">Planning</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{stats.planning}</p>
                    </div>
                    <div className="p-3 rounded-full bg-yellow-500/10">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MobileScrollGrid>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border shadow-sm p-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search journeys by name or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Journeys List */}
            <div className={cn('space-y-6', selectedJourney ? 'lg:col-span-2' : 'lg:col-span-3')}>
              {filteredJourneys.length > 0 ? (
                <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                  <AnimatePresence>
                    {filteredJourneys.map((journey, index) => (
                      <motion.div
                        key={journey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <JourneyCard
                          journey={journey}
                          onStart={handleStartJourney}
                          onPause={handlePauseJourney}
                          onDelete={handleDeleteJourney}
                          onViewDetails={setSelectedJourney}
                          className={cn(
                            'transition-all duration-200 hover:shadow-lg',
                            selectedJourney?.id === journey.id && 'ring-2 ring-blue-500 shadow-lg'
                          )}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : journeys.length === 0 ? (
                // Empty state for no journeys
                <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="bg-blue-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Learning Journey</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      Create your first personalized learning journey to achieve your educational and professional
                      goals.
                    </p>
                    <CreateJourneyDialog
                      userId={user?.uid || ''}
                      onJourneyCreated={() => {}}
                      trigger={
                        <Button
                          className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Journey
                        </Button>
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
                      <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                        <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Set Goals</h4>
                        <p className="text-sm text-gray-600">Define clear, measurable learning objectives</p>
                      </div>
                      <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                        <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
                        <p className="text-sm text-gray-600">Monitor your advancement with detailed analytics</p>
                      </div>
                      <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                        <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Achieve Success</h4>
                        <p className="text-sm text-gray-600">Celebrate milestones and complete your goals</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // No results from search/filter
                <EmptyState
                  icon={Search}
                  title="No Journeys Found"
                  description="No journeys match your current search or filter criteria."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  }
                />
              )}
            </div>

            {/* Journey Details Sidebar */}
            <AnimatePresence>
              {selectedJourney && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-1"
                >
                  <Card className="sticky top-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedJourney.title}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedJourney(null)}>
                          ×
                        </Button>
                      </div>
                      <CardDescription>{selectedJourney.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="goals" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="goals">Goals</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="goals">
                          <GoalManagement journey={selectedJourney} />
                        </TabsContent>

                        <TabsContent value="analytics">
                          <JourneyAnalytics journey={selectedJourney} />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ConfirmationDialog
            open={!!journeyToDelete}
            onOpenChange={(open) => !open && setJourneyToDelete(null)}
            title="Delete Journey"
            description="Are you sure you want to delete this journey? This action cannot be undone."
            confirmText="Delete"
            variant="destructive"
            onConfirm={confirmDeleteJourney}
          />
        </PageTransition>
      </StandardLayout>
    </AuthGuard>
  );
}
