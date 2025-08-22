'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Target, 
  Brain, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar,
  BarChart3,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  Quote,
  Award,
  Shield,
  Rocket,
  Globe,
  Clock,
  ChevronRight,
  Sparkles,
  Trophy,
  Medal,
  Crown,
  Lightbulb,
  Heart,
  Cpu,
  Database,
  BarChart,
  PieChart,
  Activity,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (loading) return;

      if (!user) {
        setChecking(false);
        return; // Show landing page
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.onboardingComplete) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } else {
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        router.push('/onboarding');
      } finally {
        setChecking(false);
      }
    };

    checkUserStatus();
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        </div>
        
        {/* Loading Content */}
        <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
            <div className="relative glass rounded-2xl p-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gradient mb-2">Exam Strategy Engine</h1>
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
              <span className="text-xl font-bold text-gradient">Exam Strategy Engine</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-sm">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="text-sm gradient-primary text-white border-0">Get Started</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              🚀 Universal Exam Preparation Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Transform Your Exam Prep with{' '}
              <span className="text-gradient">Strategic Intelligence</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              A data-driven operating system that transforms unstructured studying into 
              an adaptive, strategic process. Track progress, optimize performance, and 
              ace any competitive exam.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button size="lg" className="gradient-primary text-white border-0 animate-glow">
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="glass">
                Watch Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="glass border-0 hover:scale-105 transition-transform duration-300">
                <CardHeader className="text-center">
                  <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Smart Analytics</CardTitle>
                  <CardDescription>
                    AI-powered insights into your study patterns and performance
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="glass border-0 hover:scale-105 transition-transform duration-300">
                <CardHeader className="text-center">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Real-time monitoring of your preparation with detailed metrics
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="glass border-0 hover:scale-105 transition-transform duration-300">
                <CardHeader className="text-center">
                  <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Strategic Planning</CardTitle>
                  <CardDescription>
                    Personalized study plans adapted to your exam timeline
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">Trusted by Exam Aspirants Worldwide</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="group">
                <div className="text-3xl font-bold text-gradient group-hover:scale-110 transition-transform duration-300">10K+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-gradient group-hover:scale-110 transition-transform duration-300">50+</div>
                <div className="text-muted-foreground">Exam Types</div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-gradient group-hover:scale-110 transition-transform duration-300">95%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-gradient group-hover:scale-110 transition-transform duration-300">1M+</div>
                <div className="text-muted-foreground">Hours Studied</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Real Results from Real Students
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of successful candidates who transformed their exam preparation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Priya Sharma",
                  exam: "UPSC CSE 2024",
                  rank: "AIR 47",
                  image: "🎯",
                  quote: "The strategic approach and analytics helped me identify my weak areas and optimize my preparation timeline perfectly.",
                  improvement: "+40% efficiency"
                },
                {
                  name: "Rohit Kumar",
                  exam: "IBPS PO 2024",
                  rank: "Selected",
                  image: "🚀",
                  quote: "Micro-learning sessions during my commute and the mission system kept me motivated throughout the journey.",
                  improvement: "+60% retention"
                },
                {
                  name: "Ananya Patel",
                  exam: "SSC CGL 2024",
                  rank: "AIR 23",
                  image: "⭐",
                  quote: "The dual-persona system adapted perfectly to my study style. I felt like I had a personal mentor guiding me.",
                  improvement: "+85% accuracy"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="glass border-0 hover:scale-105 transition-all duration-300 hover:shadow-floating">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="text-3xl mr-4">{testimonial.image}</div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.exam}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          {testimonial.rank}
                        </Badge>
                      </div>
                    </div>
                    <Quote className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-xs gradient-success text-white">
                        {testimonial.improvement}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Deep Dive */}
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Advanced Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to <span className="text-gradient">Ace Your Exam</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover the comprehensive suite of tools designed to maximize your preparation efficiency
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Feature 1 - Analytics */}
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Real-Time Analytics Dashboard</h3>
                    <p className="text-muted-foreground mb-4">
                      Track your progress across all subjects with intelligent insights that identify patterns and suggest optimizations.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">Performance Trends</Badge>
                      <Badge variant="outline" className="text-xs">Weakness Analysis</Badge>
                      <Badge variant="outline" className="text-xs">Time Management</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Micro-Learning Engine</h3>
                    <p className="text-muted-foreground mb-4">
                      Spaced repetition algorithm ensures optimal retention with bite-sized learning sessions that fit your schedule.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">Spaced Repetition</Badge>
                      <Badge variant="outline" className="text-xs">Mobile Optimized</Badge>
                      <Badge variant="outline" className="text-xs">Quick Sessions</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Mission-Based Learning</h3>
                    <p className="text-muted-foreground mb-4">
                      Gamified approach with adaptive missions that adjust to your persona and learning style for maximum engagement.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">Adaptive Difficulty</Badge>
                      <Badge variant="outline" className="text-xs">Achievement System</Badge>
                      <Badge variant="outline" className="text-xs">Progress Rewards</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Preview */}
              <div className="relative">
                <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold">Performance Dashboard</h4>
                    <Badge variant="secondary" className="text-xs">Live Preview</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="gradient-primary h-2 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-gradient">42</div>
                        <div className="text-xs text-muted-foreground">Study Streak</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-gradient">89%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-4 py-2">
                <Crown className="h-4 w-4 mr-2" />
                Simple Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your Success Plan
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you're ready to unlock your full potential
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 relative">
                <CardHeader className="text-center">
                  <h3 className="text-xl font-semibold">Explorer</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">Free</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Perfect for getting started</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Basic analytics dashboard',
                      '5 micro-learning sessions/day',
                      'Simple progress tracking',
                      'Community support'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant="outline">
                    Start Free
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 relative border-2 border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="gradient-primary text-white px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="text-center">
                  <h3 className="text-xl font-semibold">Strategic Warrior</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gradient">₹499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">For serious exam preparation</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Advanced analytics & insights',
                      'Unlimited micro-learning',
                      'Mission-based learning system',
                      'Dual-persona adaptation',
                      'Priority support',
                      'Mobile app access'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 gradient-primary text-white border-0">
                    Start 7-Day Free Trial
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 relative">
                <CardHeader className="text-center">
                  <h3 className="text-xl font-semibold">Institution</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">Custom</span>
                    <span className="text-muted-foreground">/pricing</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">For coaching institutes</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Everything in Pro',
                      'Multi-student management',
                      'Bulk analytics reports',
                      'Custom branding',
                      'API access',
                      'Dedicated support'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant="outline">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Trusted by Leading Institutions</h2>
              <p className="text-muted-foreground">Join the ecosystem of success</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {[
                { name: "Leading Coaching Institute", icon: Award },
                { name: "Secure & Compliant", icon: Shield },
                { name: "Mobile Optimized", icon: Smartphone },
                { name: "24/7 Available", icon: Clock }
              ].map((trust, index) => (
                <div key={index} className="text-center">
                  <trust.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{trust.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-90"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Exam Preparation?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of successful candidates who chose the strategic path to success. 
              Start your free trial today and experience the difference.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/login">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-xl hover:scale-105 transition-all duration-300">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm opacity-80">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                7-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Cancel Anytime
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">Exam Strategy Engine</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Transforming exam preparation with strategic intelligence and data-driven insights.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Mobile App</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 Exam Strategy Engine. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}