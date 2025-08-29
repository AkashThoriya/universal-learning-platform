/**
 * @fileoverview Alternative Minimal Progress Design
 * 
 * This is an alternative approach with even more space efficiency options
 * for the onboarding progress indicator.
 */

'use client';

import { useState } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Ultra-minimal progress options for different space constraints
 */

// Option 1: Bottom floating progress bar
export const BottomFloatingProgress = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-700">
            {currentStep} of {totalSteps}
          </div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// Option 2: Side progress dots
export const SideProgressDots = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-3">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          
          return (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 shadow-lg' 
                  : isCurrent
                  ? 'bg-blue-500 shadow-lg ring-2 ring-blue-200'
                  : 'bg-gray-300'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

// Option 3: Header breadcrumb style
export const HeaderBreadcrumb = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const stepNames = ['Profile', 'Exam', 'Topics', 'Settings'];
  
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm">
          {stepNames.map((name, index) => {
            const step = index + 1;
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            
            return (
              <div key={step} className="flex items-center">
                <span className={`${
                  isCurrent 
                    ? 'text-blue-600 font-semibold' 
                    : isCompleted 
                    ? 'text-green-600' 
                    : 'text-gray-400'
                }`}>
                  {name}
                </span>
                {step < totalSteps && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Option 4: Collapsible corner indicator
export const CornerIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 rounded-full p-2"
      >
        {isExpanded ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{currentStep}/{totalSteps}</span>
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <MoreHorizontal className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

// Option 5: No progress indicator (cleanest)
export const NoProgress = () => null;
