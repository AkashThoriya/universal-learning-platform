'use client';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import PageContainer from '@/components/layout/PageContainer';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { WizardContainer } from '@/components/courses/add-course-wizard/WizardContainer';

export default function AddCoursePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />
        <PageContainer>
          <PageTransition>
            <WizardContainer />
          </PageTransition>
        </PageContainer>
      </div>
    </AuthGuard>
  );
}
