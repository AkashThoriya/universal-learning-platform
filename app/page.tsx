import {
  Target,
  Brain,
  TrendingUp,
  Zap,
  Star,
  CheckCircle,
  Quote,
  Trophy,
  Sparkles,
  BarChart,
  Shield,
  Smartphone,
  PlayCircle,
  Flame,
} from 'lucide-react';

import CTAActions from '@/components/home/CTAActions';
import HeroActions from '@/components/home/HeroActions';
import HomeNavbar from '@/components/home/HomeNavbar';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added Tabs imports

// Constants


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <HomeNavbar />

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
                <span className="font-semibold text-blue-600 dark:text-blue-400">competitive goals</span> or{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">custom skills</span> - our AI
                adapts to your style.
              </span>
            </p>

            <HeroActions />

            {/* Compact Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 opacity-80">
              <div className="flex items-center space-x-2 transition-all duration-300 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5 cursor-default">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">100% Free Forever</span>
              </div>
              <div className="flex items-center space-x-2 transition-all duration-300 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5 cursor-default">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">25K+ Active Learners</span>
              </div>
              <div className="flex items-center space-x-2 transition-all duration-300 hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5 cursor-default">
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Everything You Need to{' '}
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ace Your Goal
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto px-4">
                Discover our comprehensive suite of tools designed to maximize your preparation efficiency and transform your study experience into a strategic journey.
              </p>
            </div>

            <div className="mt-12 sm:mt-16 lg:mt-20">
              <Tabs defaultValue="core" className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">

                {/* Left Navigation Console */}
                <TabsList className="flex flex-row lg:flex-col h-auto bg-transparent gap-3 sm:gap-4 lg:w-1/3 justify-start overflow-x-auto pb-4 lg:pb-0 hide-scrollbar scroll-smooth">

                  <TabsTrigger value="core" data-activate-on-hover className="group relative justify-start text-left p-4 sm:p-5 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-blue-500/50 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-500 w-full flex-shrink-0 lg:flex-shrink overflow-hidden min-w-[240px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-data-[state=active]:from-blue-500/5 group-data-[state=active]:to-purple-500/5 transition-all duration-500" />
                    <div className="relative z-10 flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-4 group-data-[state=active]:bg-blue-500 group-data-[state=active]:shadow-lg shadow-blue-500/30 transition-all duration-500">
                        <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 group-data-[state=active]:text-white transition-colors duration-500" />
                      </div>
                      <div className="flex flex-col items-start pr-2">
                        <span className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 group-data-[state=active]:text-slate-900 dark:group-data-[state=active]:text-white transition-colors">Core Engine</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1 opacity-80 group-data-[state=active]:opacity-100 transition-opacity">Adaptive AI & Repetition</span>
                      </div>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger value="org" data-activate-on-hover className="group relative justify-start text-left p-4 sm:p-5 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-purple-500/50 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-500 w-full flex-shrink-0 lg:flex-shrink overflow-hidden min-w-[240px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-data-[state=active]:from-purple-500/5 group-data-[state=active]:to-pink-500/5 transition-all duration-500" />
                    <div className="relative z-10 flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mr-4 group-data-[state=active]:bg-purple-500 group-data-[state=active]:shadow-lg shadow-purple-500/30 transition-all duration-500">
                        <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 group-data-[state=active]:text-white transition-colors duration-500" />
                      </div>
                      <div className="flex flex-col items-start pr-2">
                        <span className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 group-data-[state=active]:text-slate-900 dark:group-data-[state=active]:text-white transition-colors">Organization</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1 opacity-80 group-data-[state=active]:opacity-100 transition-opacity">Micro-Analytics & Contexts</span>
                      </div>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger value="engage" data-activate-on-hover className="group relative justify-start text-left p-4 sm:p-5 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-orange-500/50 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-500 w-full flex-shrink-0 lg:flex-shrink overflow-hidden min-w-[240px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-data-[state=active]:from-orange-500/5 group-data-[state=active]:to-red-500/5 transition-all duration-500" />
                    <div className="relative z-10 flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mr-4 group-data-[state=active]:bg-orange-500 group-data-[state=active]:shadow-lg shadow-orange-500/30 transition-all duration-500">
                        <Target className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 group-data-[state=active]:text-white transition-colors duration-500" />
                      </div>
                      <div className="flex flex-col items-start pr-2">
                        <span className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 group-data-[state=active]:text-slate-900 dark:group-data-[state=active]:text-white transition-colors">Engagement</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1 opacity-80 group-data-[state=active]:opacity-100 transition-opacity">Missions, Habits & Streaks</span>
                      </div>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger value="util" data-activate-on-hover className="group relative justify-start text-left p-4 sm:p-5 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-green-500/50 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-500 w-full flex-shrink-0 lg:flex-shrink overflow-hidden min-w-[240px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/0 to-green-500/0 group-data-[state=active]:from-emerald-500/5 group-data-[state=active]:to-teal-500/5 transition-all duration-500" />
                    <div className="relative z-10 flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-4 group-data-[state=active]:bg-green-500 group-data-[state=active]:shadow-lg shadow-green-500/30 transition-all duration-500">
                        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 group-data-[state=active]:text-white transition-colors duration-500" />
                      </div>
                      <div className="flex flex-col items-start pr-2">
                        <span className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 group-data-[state=active]:text-slate-900 dark:group-data-[state=active]:text-white transition-colors">Utility</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1 opacity-80 group-data-[state=active]:opacity-100 transition-opacity">PWA, Notes & Mock Tests</span>
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {/* Right Floating Stage */}
                <div className="lg:w-2/3 lg:min-h-[500px] relative">
                  {/* Decorative Stage Glow */}
                  <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-[2.5rem] blur-3xl -z-10 transition-colors duration-700" />

                  {/* Core Engine */}
                  <TabsContent value="core" className="mt-0 h-full w-full animate-in zoom-in-95 slide-in-from-right-8 lg:slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                    <div className="relative p-4 sm:p-6 lg:p-8 bg-white/40 dark:bg-slate-800/30 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 backdrop-blur-2xl shadow-xl overflow-hidden h-full">
                      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] mix-blend-overlay pointer-events-none" />
                      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-400/20 rounded-full blur-[100px] mix-blend-overlay pointer-events-none" />

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 h-full">
                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl md:col-span-3">
                          <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-between pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                              <Brain className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl lg:text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">Adaptive Testing (CAT)</CardTitle>
                              <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                                Intelligent assessments that dynamically adjust to your proficiency level using Item Response Theory. The engine calibrates question difficulty in real-time.
                              </CardDescription>
                            </div>
                          </CardHeader>
                        </Card>

                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl md:col-span-2">
                          <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-between pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                              <TrendingUp className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold mb-3">Spaced Repetition</CardTitle>
                              <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Defeat the forgetting curve. Our algorithm calculates exact optimal dates for reviews based on urgency.
                              </CardDescription>
                            </div>
                          </CardHeader>
                        </Card>

                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl md:col-span-5">
                          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-6 px-6 sm:px-8 gap-6">
                            <div>
                              <div className="mb-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Zap className="h-7 w-7 text-white" />
                              </div>
                              <CardTitle className="text-xl lg:text-2xl font-bold mb-3">Micro-Learning Modules</CardTitle>
                              <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
                                Bite-sized learning for busy schedules. Engage in quick 5-10 minute hyper-focused quizzes targeting singular concepts you are currently weak at.
                              </CardDescription>
                            </div>
                          </CardHeader>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Organization */}
                  <TabsContent value="org" className="mt-0 h-full w-full animate-in zoom-in-95 slide-in-from-right-8 lg:slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                    <div className="relative p-4 sm:p-6 lg:p-8 bg-white/40 dark:bg-slate-800/30 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 backdrop-blur-2xl shadow-xl overflow-hidden h-full">
                      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-sky-400/20 rounded-full blur-[100px] mix-blend-overlay pointer-events-none" />

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full">
                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                          <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-start pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform duration-500">
                              <Target className="h-7 w-7 text-white" />
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold mb-3">Multi-Course Architecture</CardTitle>
                            <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                              Prepare for multiple distinct goals simultaneously (e.g., Programming, UPSC, CFA) with 100% data isolation context switching without stat cross-pollution.
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                          <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-start pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-500">
                              <BarChart className="h-7 w-7 text-white" />
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold mb-3">Dynamic Syllabus JSON</CardTitle>
                            <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                              Track your progress at a micro-level. Navigate hierarchical paths consisting of Subjects → Topics → Subtopics, effortlessly visualizing your completion.
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Engagement */}
                  <TabsContent value="engage" className="mt-0 h-full w-full animate-in zoom-in-95 slide-in-from-right-8 lg:slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                    <div className="relative p-4 sm:p-6 lg:p-8 bg-white/40 dark:bg-slate-800/30 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 backdrop-blur-2xl shadow-xl overflow-hidden h-full">
                      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 bg-orange-400/20 rounded-full blur-[100px] mix-blend-overlay pointer-events-none" />

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full">
                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                          <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-start pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-500">
                              <Star className="h-7 w-7 text-white" />
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold mb-3">Habits System</CardTitle>
                            <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                              Track daily consistency, unlock streaks, and correlate your learning dedication directly to your overall score improvements and trajectory via data visualizations.
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                            <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                            <CardHeader className="relative z-10 pb-5 px-6">
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                                  <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle className="text-lg font-bold">Intelligent Persona</CardTitle>
                              </div>
                              <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Engine automatically detects learning styles (Night Owl, Weekend Warrior) to dynamically restructure active schedules.
                              </CardDescription>
                            </CardHeader>
                          </Card>

                          <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                            <div className="absolute -inset-2 bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                            <CardHeader className="relative z-10 pb-5 px-6">
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                                  <Trophy className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle className="text-lg font-bold">Daily Missions</CardTitle>
                              </div>
                              <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Complete highly-personalized daily and weekly AI-generated missions (e.g. "Complete 3 weak topics") to earn milestone badges.
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Utility */}
                  <TabsContent value="util" className="mt-0 h-full w-full animate-in zoom-in-95 slide-in-from-right-8 lg:slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                    <div className="relative p-4 sm:p-6 lg:p-8 bg-white/40 dark:bg-slate-800/30 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 backdrop-blur-2xl shadow-xl overflow-hidden h-full">
                      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-64 h-64 bg-teal-400/20 rounded-full blur-[100px] mix-blend-overlay pointer-events-none" />

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 h-full">
                        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl md:col-span-3">
                          <div className="absolute -inset-2 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                          <CardHeader className="relative z-10 h-full flex flex-col justify-start pb-6 px-6">
                            <div className="mb-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-500">
                              <Smartphone className="h-7 w-7 text-white" />
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold mb-3">PWA Offline Support</CardTitle>
                            <CardDescription className="text-sm lg:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                              Fully installable on iOS and Android home screens. Study core syllabus content entirely offline and sync automatically silently upon internet connection restoration.
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:col-span-2">
                          <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                            <CardHeader className="relative z-10 pb-5 px-6">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                  <Quote className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-base font-bold">Daily Notes Vault</CardTitle>
                              </div>
                              <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                Upload handwritten physical notes with localized automated web-based image compression to save massive storage space.
                              </CardDescription>
                            </CardHeader>
                          </Card>

                          <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl">
                            <div className="absolute -inset-2 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl z-0" />
                            <CardHeader className="relative z-10 pb-5 px-6">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                                  <Shield className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-base font-bold">Mock Analysis</CardTitle>
                              </div>
                              <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                Simulate full length paper conditions. Record your section-wise scores securely to chart visual trajectories toward the ultimate cut-off.
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </section>


        {/* Enhanced Features Deep Dive */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-12 md:mb-20">
              <Badge variant="secondary" className="mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm border border-blue-200">
                <Sparkles className="h-4 w-4 mr-2" />
                Advanced Features
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
                Everything You Need to{' '}
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ace Your Goal
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                Discover our comprehensive suite of tools designed to maximize your preparation efficiency and transform
                your study experience into a strategic journey.
              </p>
            </div>

            <div className="grid xl:grid-cols-2 gap-6 sm:gap-8 xl:gap-12 items-center px-4">
              {/* Feature List */}
              <div className="space-y-8 lg:space-y-10">
                <div className="flex items-start space-x-4 sm:space-x-6 group cursor-default">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Adaptive Engine (CAT/IRT)</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Powered by Item Response Theory. Real-time test difficulty dynamically adjusts up or down based on your consecutive correct or incorrect answers for highly accurate baseline profiling.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Item Response Theory
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Automated Calibration
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Dynamic Tuning
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6 group cursor-default">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Scientific Spaced Repetition</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Custom algorithm calculates the mathematically optimal date to review previous topics, eliminating the forgetting curve while sorting by maximum impact priority.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Memory Curve Engine
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Priority Queueing
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Urgent Sort
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6 group cursor-default">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                    <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Handwritten Note Vault</h3>
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-base sm:text-lg leading-relaxed">
                      Seamlessly upload photos of your physical notebook into the specific subtopic folder. Integrated automatic web-compression shrinks file sizes dramatically on upload.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Client-side Compression
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Hierarchical Storage
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                        Topic Tagging
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Dashboard Preview - Refactored to match live UI */}
              <div className="relative mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl opacity-50" />
                <Card className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 hover:-translate-y-1 transition-all duration-300 relative shadow-2xl hover:shadow-floating group cursor-default border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h4 className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Performance Dashboard
                    </h4>
                    <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-[10px] sm:text-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
                      Live
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* "Continue where you left off" Card (from AdaptiveDashboard.tsx) */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-l-4 border-l-green-500">
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full">
                              <PlayCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Continue learning</span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Neural Networks Intro
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 text-xs gap-1.5 hidden sm:flex"
                        >
                          <PlayCircle className="h-3 w-3" />
                          Resume
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                      {/* Current Streak Card (from StatsGrid.tsx) */}
                      <Card className="bg-white dark:bg-slate-800 border-orange-100 dark:border-orange-900/30 shadow-sm transition-all">
                        <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                              <Flame className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              🔥 On Fire
                            </span>
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">42 <span className="text-sm sm:text-base text-gray-400 font-normal">days</span></div>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Current Streak</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weekly Goal Progress (from StatsGrid.tsx) */}
                      <Card className="bg-white dark:bg-slate-800 border-purple-100 dark:border-purple-900/30 shadow-sm transition-all">
                        <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full relative overflow-hidden">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 relative z-10">
                              <Target className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full relative z-10">
                              78%
                            </span>
                          </div>
                          <div className="relative z-10 mt-1 sm:mt-0">
                            <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-1.5 sm:h-2 mb-1 sm:mb-2 overflow-hidden">
                              <div className="bg-purple-600 h-1.5 sm:h-2 rounded-full w-[15%] group-hover:w-[78%] transition-all duration-[1500ms] ease-out shadow-sm" />
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Weekly Goal</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Free Platform Section - Seamless continuation */}
        <section className="py-12 sm:py-20 md:py-24 px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-800 relative overflow-hidden">
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Premium Features,{' '}
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Zero Cost
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
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
                    className={`glass border-0 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl ${
                      index >= MOBILE_SPAN_THRESHOLD ? 'sm:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6 text-center group cursor-default">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/60 dark:border-slate-700/50 mx-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-800 dark:text-blue-200">🎯 Our Mission</h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                To democratize learning by providing world-class tools and insights to every student, regardless of
                their economic background. Your success is our success.
              </p>
            </div>
          </div>
        </section>

        {/* Premium Offline / PWA Highlights */}
        <section className="py-12 sm:py-16 md:py-20 px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-blue-50 dark:from-indigo-900/40 dark:via-slate-900 dark:to-blue-900/40">
          <div className="absolute inset-0 bg-grid-slate-100/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/20" />
          {/* Subtle animated glow behind mockup */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-400/20 blur-[100px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="flex-1 text-center md:text-left">
              <Badge variant="secondary" className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 mb-6 px-4 py-2 hover:bg-white/80 transition-all shadow-sm inline-flex">
                <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
                Offline-Ready PWA
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight text-slate-900 dark:text-white">
                Learn Anywhere.<span className="hidden sm:inline"><br /></span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-teal-300 dark:to-cyan-400">Even Offline.</span>
              </h2>
              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-6 sm:mb-8 font-light">
                Install Universal Learning Platform directly to your mobile home screen. Pre-load your syllabus modules, review notes without an internet connection, and automatically background-sync your daily logs the second you reconnect.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
                  <Shield className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Auto-Sync</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium">Zero App Store Required</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-5/12 lg:w-1/3 flex justify-center md:justify-end perspective-1000">
              <div className="relative w-56 sm:w-64 aspect-[9/19] rounded-[2.5rem] bg-black border-[8px] sm:border-[12px] border-black shadow-[0_0_40px_rgba(99,102,241,0.2)] md:shadow-2xl overflow-hidden hover:scale-105 transition-all duration-500 transform-gpu group">
                {/* Dynamic Island */}
                <div className="absolute top-2 inset-x-0 h-5 bg-black rounded-full w-24 mx-auto z-20 flex items-center justify-end px-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />
                </div>
                {/* Glass/Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/10 z-10 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

                {/* Screen Content - Light Mode Design with Dark Mode Support */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900 dark:via-slate-900 dark:to-purple-900 mt-0 flex flex-col items-center justify-center p-6 text-center z-0">
                  <Target className="h-12 w-12 text-blue-500 dark:text-teal-400 mb-5 animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
                  <div className="text-slate-800 dark:text-white font-bold text-lg mb-2 tracking-wide">Offline Mode</div>
                  <div className="text-teal-600 dark:text-teal-200/80 text-xs uppercase tracking-widest font-semibold flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Syllabus Synced
                  </div>
                  <div className="mt-8 w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-teal-400 dark:to-emerald-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA Section - Natural Flow */}
        <section className="py-12 sm:py-20 md:py-24 px-6 lg:px-8 relative overflow-hidden">
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

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the revolution in learning. Experience the power of strategic goal achievement, backed by AI insights
              and proven methodologies for both exams and custom skills.
            </p>

            <CTAActions />

            {/* Enhanced trust indicators */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mb-6 sm:mb-8">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm hover:-translate-y-1 hover:shadow-lg transition-all cursor-default">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">No Credit Card Required</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm hover:-translate-y-1 hover:shadow-lg transition-all cursor-default">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">100% Free Forever</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm sm:col-span-2 lg:col-span-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-default">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="font-medium text-sm sm:text-base">Privacy Focused</span>
              </div>
            </div>
          </div>
        </section>
      </PageTransition>
    </div>
  );
}
