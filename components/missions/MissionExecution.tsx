'use client';

import {
  Play,
  Pause,
  SkipForward,
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Code,
  Lightbulb,
  Timer,
  Home,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { missionService } from '@/lib/mission-service';
import {
  type Mission,
  type MissionProgress,
  type MissionResults,
  type ExamQuestion,
  type TechChallenge,
} from '@/types/mission-system';

interface MissionExecutionProps {
  mission: Mission;
  onComplete?: (results: MissionResults) => void;
  onPause?: () => void;
  onExit?: () => void;
  className?: string;
}

export function MissionExecution({ mission, onComplete, onPause, onExit, className = '' }: MissionExecutionProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [submissions, setSubmissions] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  // const [progress, setProgress] = useState<MissionProgress>(mission.progress);
  const [_progress] = useState<MissionProgress>(mission.progress); // Prefixed with _ to indicate unused
  const [error, setError] = useState<string | null>(null);

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isPaused]);

  // Auto-save progress
  useEffect(() => {
    if (isActive && user?.uid) {
      const saveProgress = async () => {
        const updatedProgress: Partial<MissionProgress> = {
          currentStep,
          timeSpent: Math.floor(timeSpent / 60), // Convert to minutes
          completionPercentage: Math.floor((currentStep / getTotalSteps()) * 100),
          submissions: Object.entries(submissions).map(([stepIndex, answer]) => ({
            id: `sub_${stepIndex}_${Date.now()}`,
            stepId: stepIndex.toString(),
            type: 'answer',
            content: answer,
            submittedAt: new Date(),
            isFinal: false,
          })),
        };

        if (user?.uid) {
          await missionService.updateMissionProgress(user.uid, mission.id, updatedProgress);
        }
      };

      // Save every 30 seconds
      const saveInterval = setInterval(saveProgress, 30000);
      return () => clearInterval(saveInterval);
    }

    // Ensure all code paths return a value
    return undefined;
  }, [mission.id, currentStep, timeSpent, submissions, isActive, user?.uid]);

  const startMission = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseMission = () => {
    setIsPaused(true);
    if (onPause) {
      onPause();
    }
  };

  const resumeMission = () => {
    setIsPaused(false);
  };

  const getTotalSteps = (): number => {
    if (mission.content.examContent?.questions) {
      return mission.content.examContent.questions.length;
    } else if (mission.content.techContent?.deliverables) {
      return mission.content.techContent.deliverables.length;
    }
    return 1;
  };

  const getCurrentQuestion = (): ExamQuestion | null => {
    if (mission.content.examContent?.questions) {
      return mission.content.examContent.questions[currentStep] ?? null;
    }
    return null;
  };

  const getCurrentChallenge = (): TechChallenge | null => {
    if (mission.content.techContent?.challenge) {
      return mission.content.techContent.challenge;
    }
    return null;
  };

  const handleAnswer = (answer: string) => {
    setCurrentAnswer(answer);
    setSubmissions(prev => ({
      ...prev,
      [currentStep]: answer,
    }));
  };

  const nextStep = () => {
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
      setCurrentAnswer(submissions[currentStep + 1] ?? '');
      setShowExplanation(false);
    } else {
      completeMission();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setCurrentAnswer(submissions[currentStep - 1] ?? '');
      setShowExplanation(false);
    }
  };

  const skipStep = () => {
    setSubmissions(prev => ({
      ...prev,
      [currentStep]: 'skipped',
    }));
    nextStep();
  };

  const completeMission = async () => {
    try {
      setIsActive(false);

      // Prepare final submissions
      const finalSubmissions = Object.entries(submissions).map(([stepIndex, answer]) => ({
        id: `sub_${stepIndex}_${Date.now()}`,
        stepId: stepIndex.toString(),
        type: 'answer',
        content: answer,
        submittedAt: new Date(),
        isFinal: true,
      }));

      // Complete mission and get results
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const result = await missionService.completeMission(user.uid, mission.id, finalSubmissions);

      if (result.success && result.data && onComplete) {
        onComplete(result.data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete mission');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = (): number => {
    const totalTimeLimit = mission.estimatedDuration * 60; // Convert to seconds
    return Math.max(0, totalTimeLimit - timeSpent);
  };

  const getTrackIcon = () => {
    return mission.track === 'exam' ? BookOpen : Code;
  };

  const getTrackColor = (): string => {
    return mission.track === 'exam' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === ' ' && event.target === document.body) {
        event.preventDefault();
        if (!isActive) {
          startMission();
        } else if (isPaused) {
          resumeMission();
        } else {
          pauseMission();
        }
      } else if (event.key === 'ArrowLeft' && currentStep > 0) {
        previousStep();
      } else if (event.key === 'ArrowRight' && currentStep < getTotalSteps() - 1) {
        nextStep();
      } else if (event.key === 'Enter' && currentAnswer) {
        nextStep();
      } else if (event.key === 'Escape') {
        if (onExit) {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, isPaused, currentStep, currentAnswer]);

  const TrackIcon = getTrackIcon();
  const timeRemaining = getTimeRemaining();
  const isTimeRunningOut = timeRemaining < 300; // Less than 5 minutes

  if (error) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">{error}</AlertDescription>
          <Button variant="outline" onClick={onExit}>
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card className={`border-2 ${getTrackColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getTrackColor()}`}>
                <TrackIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{mission.title}</CardTitle>
                <p className="text-gray-600">{mission.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {mission.difficulty}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {mission.track === 'exam' ? 'Exam' : 'Tech'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress and Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">
                    {currentStep + 1} / {getTotalSteps()}
                  </span>
                </div>
                <Progress value={((currentStep + 1) / getTotalSteps()) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Timer className={`h-5 w-5 ${isTimeRunningOut ? 'text-red-600' : 'text-green-600'}`} />
              <div>
                <div className="text-sm font-medium">Time Spent</div>
                <div className={`text-lg font-bold ${isTimeRunningOut ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeSpent)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className={`h-5 w-5 ${isTimeRunningOut ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <div className="text-sm font-medium">Time Remaining</div>
                <div className={`text-lg font-bold ${isTimeRunningOut ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Content */}
      <Card className="min-h-[400px]">
        <CardContent className="p-6">
          {!isActive ? (
            // Start Screen
            <div className="text-center py-16">
              <div className="mb-6">
                <div
                  className={`mx-auto w-16 h-16 rounded-full ${getTrackColor()} flex items-center justify-center mb-4`}
                >
                  <TrackIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to start your mission?</h3>
                <p className="text-gray-600">
                  You have {mission.estimatedDuration} minutes to complete this {mission.track} mission.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <Button
                  onClick={startMission}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Mission
                </Button>

                <div className="text-sm text-gray-500">
                  <p>
                    Tips: Use <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to play/pause,
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←→</kbd> to navigate,
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to exit
                  </p>
                </div>
              </div>
            </div>
          ) : isPaused ? (
            // Pause Screen
            <div className="text-center py-16">
              <div className="mb-6">
                <Pause className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mission Paused</h3>
                <p className="text-gray-600">Take your time. Resume when you're ready.</p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <Button
                  onClick={resumeMission}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume Mission
                </Button>

                <Button onClick={onExit} variant="outline" size="lg" className="w-full">
                  Exit Mission
                </Button>
              </div>
            </div>
          ) : (
            // Active Mission Content
            <div className="space-y-6">
              {/* Exam Content */}
              {mission.track === 'exam' &&
                (() => {
                  const question = getCurrentQuestion();
                  if (!question) {
                    return <div>No question available</div>;
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Question {currentStep + 1} of {getTotalSteps()}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{question.subject}</Badge>
                          <Badge variant="outline">{question.topic}</Badge>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <p className="text-gray-900 text-lg leading-relaxed">{question.question}</p>
                      </div>

                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-3">
                          <RadioGroup value={currentAnswer} onValueChange={handleAnswer}>
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}

                      {(question.type === 'short_answer' || question.type === 'essay') && (
                        <div className="space-y-2">
                          <Label htmlFor="answer">Your Answer</Label>
                          <Textarea
                            id="answer"
                            value={currentAnswer}
                            onChange={e => handleAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            rows={question.type === 'essay' ? 8 : 4}
                          />
                        </div>
                      )}

                      {showExplanation && question.explanation && (
                        <Alert>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Explanation:</strong> {question.explanation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })()}

              {/* Tech Content */}
              {mission.track === 'course_tech' &&
                (() => {
                  const challenge = getCurrentChallenge();
                  if (!challenge) {
                    return <div>No challenge available</div>;
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{challenge.title}</h3>
                        <Badge variant="secondary">{challenge.type}</Badge>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium mb-3">Problem Statement</h4>
                        <p className="text-gray-900 leading-relaxed">{challenge.problemStatement}</p>
                      </div>

                      {challenge.examples.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Examples</h4>
                          {challenge.examples.map((example, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Input</div>
                                  <code className="text-sm bg-white p-2 rounded block mt-1">{example.input}</code>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Output</div>
                                  <code className="text-sm bg-white p-2 rounded block mt-1">{example.output}</code>
                                </div>
                              </div>
                              {example.explanation && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium text-gray-600">Explanation</div>
                                  <p className="text-sm text-gray-700 mt-1">{example.explanation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="code">Your Solution</Label>
                        <Textarea
                          id="code"
                          value={currentAnswer}
                          onChange={e => handleAnswer(e.target.value)}
                          placeholder="Write your code here..."
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>

                      {challenge.hints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Hints</h4>
                          {challenge.hints.map((hint, index) => (
                            <Alert key={index}>
                              <Lightbulb className="h-4 w-4" />
                              <AlertDescription>{hint}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      {isActive && !isPaused && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={previousStep} disabled={currentStep === 0} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button variant="outline" onClick={pauseMission} className="gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>

                <Button variant="outline" onClick={skipStep} className="gap-2">
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                {!showExplanation && mission.track === 'exam' && (
                  <Button variant="outline" onClick={() => setShowExplanation(true)} className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Show Hint
                  </Button>
                )}

                <Button
                  onClick={nextStep}
                  disabled={!currentAnswer && currentAnswer !== ''}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
                >
                  {currentStep === getTotalSteps() - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Warning */}
      {isTimeRunningOut && isActive && !isPaused && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Time Warning:</strong> You have less than 5 minutes remaining!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
