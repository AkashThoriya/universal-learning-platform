'use client';

import PageTransition from '@/components/layout/PageTransition';
import { doc, getDoc } from 'firebase/firestore';
import {
  Loader2,
  Target,
  Brain,
  TrendingUp,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Quote,
  Rocket,
  Trophy,
  Sparkles,
  BarChart,
  Shield,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';

// Constants
const STAR_RATING = 5;

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setChecking(false);
        return; // Show landing page
      }

      try {
        // Add timeout for Firebase operations
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), 5000)
        );

        const userDocPromise = getDoc(doc(db, 'users', user.uid));

        const userDoc = await Promise.race([userDocPromise, timeoutPromise]);

        if (
          userDoc &&
          typeof userDoc === 'object' &&
          'exists' in userDoc &&
          typeof userDoc.exists === 'function' &&
          userDoc.exists()
        ) {
          const userData = 'data' in userDoc && typeof userDoc.data === 'function' ? userDoc.data() : null;

          // Check both onboardingComplete and onboardingCompleted for compatibility
          const isOnboardingComplete = userData && (userData.onboardingComplete || userData.onboardingCompleted);

          console.log('User onboarding status check:', {
            userId: user.uid,
            onboardingComplete: userData?.onboardingComplete,
            onboardingCompleted: userData?.onboardingCompleted,
            isComplete: isOnboardingComplete,
            hasDisplayName: !!userData?.displayName,
            hasSelectedExamId: !!userData?.selectedExamId,
            hasPreferences: !!userData?.preferences,
          });

          if (isOnboardingComplete) {
            console.log('Onboarding already completed, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            console.log('Onboarding not completed, redirecting to onboarding');
            router.push('/onboarding');
          }
        } else {
          console.log('No user document found, redirecting to onboarding');
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Fallback: if Firebase is having issues, still allow access
        if (user) {
          router.push('/dashboard');
        }
      } finally {
        setChecking(false);
      }
    };

    // Add overall timeout for the entire check
    const timeoutId = setTimeout(() => {
      console.warn('User status check taking too long, proceeding with fallback');
      setChecking(false);
      if (user) {
        router.push('/dashboard');
      }
    }, 8000);

    checkUserStatus().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
            <div className="relative glass rounded-2xl p-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gradient mb-2">Universal Learning Platform</h1>
              <p className="text-muted-foreground">Initializing your strategic learning experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        {/* Navigation */}
        <nav className="relative z-50 px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gradient">Universal Learning Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="text-sm gradient-primary text-white border-0">Get Started</Button>
              </Link>
            </div>
          </div>
        </nav>

        <PageTransition>
        {/* Hero Section - Optimized Above-the-Fold */}
        <section className="relative px-6 lg:px-8 pt-8 pb-12 overflow-hidden min-h-[90vh] flex items-center">
          {/* Enhanced Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-40 right-20 w-24 h-24 sm:w-32 sm:h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000" />
            <div className="absolute bottom-20 left-1/4 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-500" />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
            <Badge
              variant="secondary"
              className="mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium bg-white/80 backdrop-blur-sm border border-blue-200 hover:scale-105 transition-transform duration-300"
            >
              🚀 The Future of Strategic Learning is Here
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1] max-w-4xl mx-auto">
              <span className="block mb-2">Master Any Goal</span>
              <span className="block text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient leading-[1.1]">
                with AI-Powered Strategy
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Transform chaotic studying into strategic, data-driven learning.{' '}
              <span className="block sm:inline">
                Whether targeting{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">competitive exams</span> or{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">custom skills</span> - our AI
                adapts to your style.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gradient-primary text-white border-0 shadow-2xl hover:shadow-primary/25 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold hover:scale-105"
                >
                  <Rocket className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Start Your Learning Journey
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>

            {/* Compact Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 opacity-80">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">100% Free Forever</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">25K+ Active Learners</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">Instant Access</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlight Section - Seamless Transition */}
        <section className="py-12 sm:py-16 px-6 lg:px-8 relative overflow-hidden">
          {/* Seamless Background Transition */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 dark:from-gray-900 dark:via-blue-900 dark:to-slate-900">
            <div className="absolute inset-0 bg-grid-slate-100/30 [mask-image:linear-gradient(180deg,transparent,white,transparent)] dark:bg-grid-slate-700/20" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Everything You Need to{' '}
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Succeed
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Comprehensive AI-powered tools for learning and personal development
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-4">
              <Card className="glass border-0 hover:scale-105 transition-all duration-500 hover:shadow-2xl group">
                <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
                  <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2 sm:mb-3">Smart Analytics</CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    AI insights that identify patterns, predict weak areas, and optimize your strategy
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-0 hover:scale-105 transition-all duration-500 hover:shadow-2xl group">
                <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
                  <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2 sm:mb-3">Progress Mastery</CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    Visual dashboards that transform study data into actionable insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-0 hover:scale-105 transition-all duration-500 hover:shadow-2xl group">
                <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
                  <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2 sm:mb-3">Strategic Planning</CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    Personalized study plans that evolve with your progress
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-0 hover:scale-105 transition-all duration-500 hover:shadow-2xl group">
                <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
                  <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2 sm:mb-3">Custom Learning</CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    Pursue any goal from Docker mastery to language learning
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="py-16 sm:py-20 relative overflow-hidden">
          {/* Seamless Background Continuation */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
            <div className="absolute inset-0 bg-grid-slate-100/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <Badge
              variant="secondary"
              className="mb-6 sm:mb-8 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-blue-200 text-sm sm:text-base"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Global Impact
            </Badge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Transforming Learning{' '}
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Worldwide
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground mb-12 sm:mb-16 max-w-3xl mx-auto px-4">
              Join a thriving community achieving exam success and custom learning goals
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 px-4">
              <div className="group cursor-pointer">
                <Card className="glass border-0 hover:scale-110 transition-all duration-500 hover:shadow-2xl">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 mb-1 sm:mb-2">
                      25K+
                    </div>
                    <div className="text-muted-foreground font-medium text-xs sm:text-sm lg:text-base">
                      Active Learners
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Growing daily</div>
                  </CardContent>
                </Card>
              </div>

              <div className="group cursor-pointer">
                <Card className="glass border-0 hover:scale-110 transition-all duration-500 hover:shadow-2xl">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 mb-1 sm:mb-2">
                      150+
                    </div>
                    <div className="text-muted-foreground font-medium text-xs sm:text-sm lg:text-base">
                      Learning Goals
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Exams & Skills</div>
                  </CardContent>
                </Card>
              </div>

              <div className="group cursor-pointer">
                <Card className="glass border-0 hover:scale-110 transition-all duration-500 hover:shadow-2xl">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 mb-1 sm:mb-2">
                      98%
                    </div>
                    <div className="text-muted-foreground font-medium text-xs sm:text-sm lg:text-base">
                      Goal Achievement
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Proven results</div>
                  </CardContent>
                </Card>
              </div>

              <div className="group cursor-pointer">
                <Card className="glass border-0 hover:scale-110 transition-all duration-500 hover:shadow-2xl">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 mb-1 sm:mb-2">
                      5M+
                    </div>
                    <div className="text-muted-foreground font-medium text-xs sm:text-sm lg:text-base">Study Hours</div>
                    <div className="text-xs text-muted-foreground mt-1">Tracked & optimized</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional trust indicators */}
            <div className="mt-8 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500" />
                <span className="font-medium text-xs sm:text-sm lg:text-base">Zero Hidden Costs</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500" />
                <span className="font-medium text-xs sm:text-sm lg:text-base">Privacy Protected</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-500" />
                <span className="font-medium text-xs sm:text-sm lg:text-base">Instant Access</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-24 px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
            <div className="absolute inset-0 bg-grid-slate-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <Badge
                variant="secondary"
                className="mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm border border-purple-200"
              >
                <Star className="h-4 w-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Dreams Achieved,{' '}
                <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Lives Transformed
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Real students, real results. See how our platform has helped thousands of candidates achieve their exam
                dreams and career aspirations.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
              {[
                {
                  name: 'Priya Sharma',
                  exam: 'UPSC CSE 2024',
                  rank: 'AIR 47',
                  image: '🎯',
                  quote:
                    'The strategic approach transformed my chaotic preparation into a systematic journey. The analytics helped me identify patterns I never noticed before.',
                  improvement: '+65% efficiency',
                  bg: 'from-blue-500 to-purple-500',
                },
                {
                  name: 'Rohit Kumar',
                  exam: 'IBPS PO 2024',
                  rank: 'Selected',
                  image: '🚀',
                  quote:
                    'Micro-learning during my daily commute and the mission system made studying addictive. I actually looked forward to my study sessions!',
                  improvement: '+80% retention',
                  bg: 'from-green-500 to-teal-500',
                },
                {
                  name: 'Ananya Patel',
                  exam: 'SSC CGL 2024',
                  rank: 'AIR 23',
                  image: '⭐',
                  quote:
                    'The dual-persona system felt like having a personal mentor. It adapted to my mood and energy levels perfectly throughout my preparation.',
                  improvement: '+90% accuracy',
                  bg: 'from-orange-500 to-red-500',
                },
              ].map((testimonial, index) => (
                <Card
                  key={index}
                  className={`glass border-0 hover:scale-105 transition-all duration-500 hover:shadow-2xl group overflow-hidden ${
                    index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div className={`h-2 bg-gradient-to-r ${testimonial.bg}`} />
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                      <div className="text-3xl sm:text-4xl">{testimonial.image}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                          <h4 className="font-bold text-base sm:text-lg truncate">{testimonial.name}</h4>
                          <Badge variant="outline" className="text-xs font-medium self-start sm:self-auto">
                            <Trophy className="h-3 w-3 mr-1" />
                            {testimonial.rank}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{testimonial.exam}</p>
                      </div>
                    </div>

                    <div className="relative mb-4 sm:mb-6">
                      <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-3 opacity-50" />
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic">
                        "{testimonial.quote}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex text-yellow-500">
                        {[...Array(STAR_RATING)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                        ))}
                      </div>
                      <Badge className={`text-xs font-bold bg-gradient-to-r ${testimonial.bg} text-white border-0`}>
                        {testimonial.improvement}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to action within testimonials */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-purple-200 dark:border-purple-700">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Join 25,000+ successful candidates</span>
                <ArrowRight className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Deep Dive */}
        <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <Badge variant="secondary" className="mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm border border-blue-200">
                <Sparkles className="h-4 w-4 mr-2" />
                Advanced Features
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Everything You Need to{' '}
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ace Your Exam
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Discover our comprehensive suite of tools designed to maximize your preparation efficiency and transform
                your study experience into a strategic journey.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center px-4">
              {/* Feature List */}
              <div className="space-y-8 lg:space-y-10">
                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <BarChart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Real-Time Analytics Dashboard</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Track your progress across all subjects with intelligent insights that identify patterns, predict
                      performance trends, and suggest optimizations.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Performance Trends
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Weakness Analysis
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Time Management
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Progress Forecasting
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Micro-Learning Engine</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Spaced repetition algorithm ensures optimal retention with bite-sized learning sessions that fit
                      perfectly into your busy schedule.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Spaced Repetition
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Mobile Optimized
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Quick Sessions
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Offline Support
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Mission-Based Learning</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Gamified approach with adaptive missions that adjust to your persona and learning style for
                      maximum engagement and motivation.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Adaptive Difficulty
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Achievement System
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Progress Rewards
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Streak Tracking
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Dashboard Preview */}
              <div className="relative mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl" />
                <Card className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:scale-105 transition-all duration-500 relative border-0 shadow-2xl">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h4 className="text-lg sm:text-xl font-bold">Performance Dashboard</h4>
                    <Badge className="bg-green-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium text-sm sm:text-base">Overall Progress</span>
                      <span className="text-base sm:text-lg font-bold text-green-600">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 sm:h-3 rounded-full w-3/4 animate-pulse shadow-lg" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                      <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0">
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-1">
                            42
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">Study Streak</div>
                        </div>
                      </Card>
                      <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-0">
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-gradient bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent pb-1">
                            89%
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">Accuracy</div>
                        </div>
                      </Card>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Next milestone in</span>
                        <span className="font-medium text-orange-600">3 days</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Free Platform Section - Seamless continuation */}
        <section className="py-20 sm:py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-800 relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-grid-slate-100/20 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/10" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <Badge
              variant="secondary"
              className="mb-6 px-4 sm:px-6 py-2 sm:py-3 bg-white/90 text-blue-800 border-blue-300 dark:bg-gray-800/90 dark:text-blue-200 dark:border-blue-700 text-sm sm:text-base backdrop-blur-sm"
            >
              <Star className="h-4 w-4 mr-2" />
              100% Free Forever
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Premium Features,{' '}
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Zero Cost
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto px-4">
              Access all advanced features without any hidden fees or subscriptions. We believe quality education should
              be accessible to everyone.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 px-4">
              {[
                { icon: BarChart, title: 'Advanced Analytics', desc: 'Comprehensive performance insights' },
                { icon: Zap, title: 'Unlimited Learning', desc: 'No limits on sessions or content' },
                { icon: Target, title: 'Mission System', desc: 'Gamified learning experience' },
                { icon: Brain, title: 'AI-Powered Insights', desc: 'Personalized recommendations' },
                { icon: Smartphone, title: 'Mobile Access', desc: 'Learn anywhere, anytime' },
                { icon: Shield, title: 'Premium Support', desc: 'Community-driven assistance' },
              ].map((feature, index) => {
                const MOBILE_SPAN_THRESHOLD = 4;
                return (
                  <Card
                    key={index}
                    className={`glass border-0 hover:scale-105 transition-all duration-300 hover:shadow-xl ${
                      index >= MOBILE_SPAN_THRESHOLD ? 'sm:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6 text-center">
                      <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-800/50 mx-4 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-800 dark:text-blue-200">🎯 Our Mission</h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                To democratize learning by providing world-class tools and insights to every student, regardless of
                their economic background. Your success is our success.
              </p>
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA Section - Natural Flow */}
        <section className="py-20 sm:py-24 px-6 lg:px-8 relative overflow-hidden">
          {/* Seamless gradient evolution from previous section */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
            <div className="absolute inset-0 bg-grid-slate-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
            <Badge
              variant="secondary"
              className="mb-6 sm:mb-8 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-purple-200 text-sm sm:text-base"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Your Success Journey Starts Now
            </Badge>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
              Ready to{' '}
              <span className="text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Transform
              </span>{' '}
              Your Future?
            </h2>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the revolution in learning. Experience the power of strategic goal achievement, backed by AI insights
              and proven methodologies for both exams and custom skills.
            </p>

            <div className="flex justify-center mb-8 sm:mb-12">
              <Link href="/login">
                <Button
                  size="lg"
                  className="gradient-primary text-white border-0 shadow-2xl hover:shadow-primary/25 transition-all duration-300 px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold hover:scale-105"
                >
                  <Rocket className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Start Your Learning Journey
                  <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>
            </div>

            {/* Enhanced trust indicators */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mb-6 sm:mb-8">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">No Credit Card Required</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">100% Free Forever</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">Instant Access</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground opacity-70">
              Join 25,000+ students who are already on their path to success
            </p>
          </div>
        </section>
        </PageTransition>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 sm:py-16 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6 sm:gap-8">
              <div className="md:col-span-1">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="text-base sm:text-lg font-bold">Universal Learning Platform</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Transforming learning with strategic intelligence and data-driven insights. Whether mastering exams or
                  custom skills, your success is our mission.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>
                    <Link href="/dashboard" className="hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/subjects" className="hover:text-white transition-colors">
                      Subjects
                    </Link>
                  </li>
                  <li>
                    <Link href="/analytics" className="hover:text-white transition-colors">
                      Analytics
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>
                    <Link href="/help" className="hover:text-white transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/community" className="hover:text-white transition-colors">
                      Community
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>
                    <Link href="/about" className="hover:text-white transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white transition-colors">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
              <p>&copy; 2024 Universal Learning Platform. All rights reserved. Made with ❤️ for learners worldwide.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
