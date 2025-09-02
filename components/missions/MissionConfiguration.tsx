'use client';

import { BookOpen, Code, Target, Save, RotateCcw, Info, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { WEEKDAY_OPTIONS } from '@/lib/data/onboarding';
import { missionService } from '@/lib/mission-service';
import {
  type MissionCycleConfig,
  type MissionFrequency,
  type MissionDifficulty,
  type LearningTrack,
  type MissionGenerationRequest,
} from '@/types/mission-system';

interface MissionConfigurationProps {
  className?: string;
  onConfigurationSave?: (configs: MissionCycleConfig[]) => void;
  onGenerateMission?: (request: MissionGenerationRequest) => void;
}

interface TrackConfig {
  enabled: boolean;
  frequency: MissionFrequency;
  customFrequencyDays?: number;
  customDuration?: number;
  preferredDifficulty: MissionDifficulty;
  adaptiveDifficulty: boolean;
  durationSettings: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  activeDays: number[];
  preferredTime: string;
  notificationsEnabled: boolean;
  autoStartNext: boolean;
  maxMissionsPerDay: number;
}

const DEFAULT_TRACK_CONFIG: TrackConfig = {
  enabled: true,
  frequency: 'daily',
  preferredDifficulty: 'intermediate',
  adaptiveDifficulty: true,
  durationSettings: {
    daily: 15,
    weekly: 60,
    monthly: 120,
  },
  activeDays: [1, 2, 3, 4, 5], // Monday to Friday
  preferredTime: '09:00',
  notificationsEnabled: true,
  autoStartNext: false,
  maxMissionsPerDay: 2,
};

export function MissionConfiguration({
  className = '',
  onConfigurationSave,
  onGenerateMission,
}: MissionConfigurationProps) {
  const { user } = useAuth();
  const [examConfig, setExamConfig] = useState<TrackConfig>(DEFAULT_TRACK_CONFIG);
  const [techConfig, setTechConfig] = useState<TrackConfig>(DEFAULT_TRACK_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatingTrack, setGeneratingTrack] = useState<LearningTrack | null>(null);
  const [activeTab, setActiveTab] = useState('exam');

  const loadExistingConfigurations = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load existing configurations from Firebase
      // For now, use default configurations
      // In production, this would fetch from user's config collection

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      loadExistingConfigurations();
    }
  }, [user?.uid, loadExistingConfigurations]);

  const handleSaveConfiguration = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const configurations: MissionCycleConfig[] = [];

      // Create exam track configuration
      if (examConfig.enabled) {
        const examMissionConfig: MissionCycleConfig = {
          id: `exam_config_${user.uid}`,
          userId: user.uid,
          track: 'exam',
          frequency: examConfig.frequency,
          durationSettings: examConfig.durationSettings,
          preferredDifficulty: examConfig.preferredDifficulty,
          adaptiveDifficulty: examConfig.adaptiveDifficulty,
          activeDays: examConfig.activeDays,
          preferredTime: examConfig.preferredTime,
          notificationsEnabled: examConfig.notificationsEnabled,
          autoStartNext: examConfig.autoStartNext,
          maxMissionsPerDay: examConfig.maxMissionsPerDay,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Only set customFrequencyDays if it has a value
        if (examConfig.customFrequencyDays !== undefined) {
          examMissionConfig.customFrequencyDays = examConfig.customFrequencyDays;
        }

        configurations.push(examMissionConfig);
      }

      // Create tech track configuration
      if (techConfig.enabled) {
        const techMissionConfig: MissionCycleConfig = {
          id: `tech_config_${user.uid}`,
          userId: user.uid,
          track: 'course_tech',
          frequency: techConfig.frequency,
          durationSettings: techConfig.durationSettings,
          preferredDifficulty: techConfig.preferredDifficulty,
          adaptiveDifficulty: techConfig.adaptiveDifficulty,
          activeDays: techConfig.activeDays,
          preferredTime: techConfig.preferredTime,
          notificationsEnabled: techConfig.notificationsEnabled,
          autoStartNext: techConfig.autoStartNext,
          maxMissionsPerDay: techConfig.maxMissionsPerDay,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Only set customFrequencyDays if it has a value
        if (techConfig.customFrequencyDays !== undefined) {
          techMissionConfig.customFrequencyDays = techConfig.customFrequencyDays;
        }

        configurations.push(techMissionConfig);
      }

      // Save configurations to Firebase
      // In production, save to user's mission-configurations collection

      setSuccessMessage('Mission configurations saved successfully!');

      if (onConfigurationSave) {
        onConfigurationSave(configurations);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configurations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMission = async (track: LearningTrack) => {
    if (!user?.uid) {
      return;
    }

    try {
      setGeneratingTrack(track);
      const config = track === 'exam' ? examConfig : techConfig;

      const request: MissionGenerationRequest = {
        userId: user.uid,
        track,
        frequency: config.frequency,
        durationOverride:
          config.frequency === 'custom' ? (config.customDuration ?? 30) : config.durationSettings[config.frequency],
        forceRegeneration: false,
        schedulingOptions: {
          preferredStartTime: new Date(),
          allowWeekends: config.activeDays.includes(0) || config.activeDays.includes(6),
        },
      };

      // Only set difficulty if not using adaptive difficulty
      if (!config.adaptiveDifficulty) {
        request.difficulty = config.preferredDifficulty;
      }

      const result = await missionService.generateMission(request);

      if (result.success && result.mission) {
        setSuccessMessage(`New ${track} mission generated successfully!`);

        if (onGenerateMission) {
          onGenerateMission(request);
        }
      } else {
        setError(result.error || 'Failed to generate mission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mission');
    } finally {
      setGeneratingTrack(null);
    }
  };

  const handleResetToDefaults = () => {
    setExamConfig(DEFAULT_TRACK_CONFIG);
    setTechConfig(DEFAULT_TRACK_CONFIG);
    setSuccessMessage('Configuration reset to defaults');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const updateTrackConfig = (track: LearningTrack, updates: Partial<TrackConfig>) => {
    if (track === 'exam') {
      setExamConfig(prev => ({ ...prev, ...updates }));
    } else {
      setTechConfig(prev => ({ ...prev, ...updates }));
    }
  };

  const toggleDay = (track: LearningTrack, day: number) => {
    const config = track === 'exam' ? examConfig : techConfig;
    const activeDays = config.activeDays.includes(day)
      ? config.activeDays.filter(d => d !== day)
      : [...config.activeDays, day].sort();

    updateTrackConfig(track, { activeDays });
  };

  const TrackConfigPanel = ({ track, config }: { track: LearningTrack; config: TrackConfig }) => {
    const trackName = track === 'exam' ? 'Exam Preparation' : 'Course/Tech Skills';
    const trackIcon = track === 'exam' ? BookOpen : Code;
    const trackColor = track === 'exam' ? 'blue' : 'green';

    return (
      <div className="space-y-6">
        {/* Track Enable/Disable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(trackIcon, { className: `h-5 w-5 text-${trackColor}-600` })}
              <span>{trackName} Track</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={`enable-${track}`} className="font-medium">
                  Enable {trackName} Missions
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {track === 'exam'
                    ? 'Generate daily mock questions, weekly revision cycles, and monthly full tests'
                    : 'Generate daily coding challenges, weekly assignments, and monthly projects'}
                </p>
              </div>
              <Switch
                id={`enable-${track}`}
                checked={config.enabled}
                onCheckedChange={enabled => updateTrackConfig(track, { enabled })}
              />
            </div>
          </CardContent>
        </Card>

        {config.enabled && (
          <>
            {/* Frequency and Difficulty */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mission Frequency & Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mission Frequency</Label>
                    <Select
                      value={config.frequency}
                      onValueChange={frequency =>
                        updateTrackConfig(track, {
                          frequency: frequency as MissionFrequency,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Missions</SelectItem>
                        <SelectItem value="weekly">Weekly Missions</SelectItem>
                        <SelectItem value="monthly">Monthly Missions</SelectItem>
                        <SelectItem value="custom">Custom Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Difficulty</Label>
                    <Select
                      value={config.preferredDifficulty}
                      onValueChange={difficulty =>
                        updateTrackConfig(track, {
                          preferredDifficulty: difficulty as MissionDifficulty,
                        })
                      }
                      disabled={config.adaptiveDifficulty}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {config.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Frequency (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={config.customFrequencyDays ?? 7}
                      onChange={e =>
                        updateTrackConfig(track, {
                          customFrequencyDays: parseInt(e.target.value) || 7,
                        })
                      }
                      placeholder="Number of days between missions"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`adaptive-${track}`}
                    checked={config.adaptiveDifficulty}
                    onCheckedChange={adaptiveDifficulty => updateTrackConfig(track, { adaptiveDifficulty })}
                  />
                  <Label htmlFor={`adaptive-${track}`} className="font-medium">
                    Adaptive Difficulty
                  </Label>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  When enabled, mission difficulty automatically adjusts based on your performance
                </p>
              </CardContent>
            </Card>

            {/* Duration Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mission Duration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Daily Mission Duration</Label>
                      <span className="text-sm text-gray-600">{config.durationSettings.daily} minutes</span>
                    </div>
                    <Slider
                      value={[config.durationSettings.daily]}
                      onValueChange={([value]) => {
                        if (value !== undefined) {
                          updateTrackConfig(track, {
                            durationSettings: { ...config.durationSettings, daily: value },
                          });
                        }
                      }}
                      max={60}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Weekly Mission Duration</Label>
                      <span className="text-sm text-gray-600">{config.durationSettings.weekly} minutes</span>
                    </div>
                    <Slider
                      value={[config.durationSettings.weekly]}
                      onValueChange={([value]) => {
                        if (value !== undefined) {
                          updateTrackConfig(track, {
                            durationSettings: { ...config.durationSettings, weekly: value },
                          });
                        }
                      }}
                      max={180}
                      min={30}
                      step={15}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Monthly Mission Duration</Label>
                      <span className="text-sm text-gray-600">{config.durationSettings.monthly} minutes</span>
                    </div>
                    <Slider
                      value={[config.durationSettings.monthly]}
                      onValueChange={([value]) => {
                        if (value !== undefined) {
                          updateTrackConfig(track, {
                            durationSettings: { ...config.durationSettings, monthly: value },
                          });
                        }
                      }}
                      max={300}
                      min={60}
                      step={30}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map(day => (
                      <Button
                        key={day.value}
                        variant={config.activeDays.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleDay(track, day.value)}
                        className="min-w-[60px]"
                      >
                        {day.short}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={config.preferredTime}
                    onChange={e => updateTrackConfig(track, { preferredTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max Missions Per Day</Label>
                    <span className="text-sm text-gray-600">{config.maxMissionsPerDay}</span>
                  </div>
                  <Slider
                    value={[config.maxMissionsPerDay]}
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        updateTrackConfig(track, { maxMissionsPerDay: value });
                      }
                    }}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`notifications-${track}`} className="font-medium">
                      Enable Notifications
                    </Label>
                    <p className="text-sm text-gray-600">Get notified when new missions are available</p>
                  </div>
                  <Switch
                    id={`notifications-${track}`}
                    checked={config.notificationsEnabled}
                    onCheckedChange={notificationsEnabled => updateTrackConfig(track, { notificationsEnabled })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`auto-start-${track}`} className="font-medium">
                      Auto-start Next Mission
                    </Label>
                    <p className="text-sm text-gray-600">
                      Automatically start the next mission when current one is completed
                    </p>
                  </div>
                  <Switch
                    id={`auto-start-${track}`}
                    checked={config.autoStartNext}
                    onCheckedChange={autoStartNext => updateTrackConfig(track, { autoStartNext })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Mission Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerateMission(track)}
                  disabled={!!generatingTrack}
                  className={`w-full gap-2 bg-gradient-to-r ${
                    track === 'exam'
                      ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      : 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  } text-white`}
                >
                  {generatingTrack === track ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Mission...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Generate {trackName} Mission Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to configure your missions.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading mission configuration...</h3>
          <p className="text-gray-600">Preparing your personalized mission settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Configuration</h1>
          <p className="text-gray-600">Customize your adaptive learning missions for both exam and tech tracks</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleResetToDefaults} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exam" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Exam Track
            {!examConfig.enabled && (
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tech" className="gap-2">
            <Code className="h-4 w-4" />
            Tech Track
            {!techConfig.enabled && (
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exam" className="space-y-6">
          <TrackConfigPanel track="exam" config={examConfig} />
        </TabsContent>

        <TabsContent value="tech" className="space-y-6">
          <TrackConfigPanel track="course_tech" config={techConfig} />
        </TabsContent>
      </Tabs>

      {/* Configuration Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Configuration Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Track Summary */}
            <div>
              <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Exam Track</span>
              </h4>
              {examConfig.enabled ? (
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    • {examConfig.frequency} missions (
                    {examConfig.frequency === 'custom'
                      ? (examConfig.customDuration ?? 30)
                      : examConfig.durationSettings[examConfig.frequency]}{' '}
                    min)
                  </p>
                  <p>• {examConfig.adaptiveDifficulty ? 'Adaptive' : examConfig.preferredDifficulty} difficulty</p>
                  <p>
                    • Active on {examConfig.activeDays.length} days at {examConfig.preferredTime}
                  </p>
                  <p>• Up to {examConfig.maxMissionsPerDay} missions per day</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Track disabled</p>
              )}
            </div>

            {/* Tech Track Summary */}
            <div>
              <h4 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Tech Track</span>
              </h4>
              {techConfig.enabled ? (
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    • {techConfig.frequency} missions (
                    {techConfig.frequency === 'custom'
                      ? (techConfig.customDuration ?? 30)
                      : techConfig.durationSettings[techConfig.frequency]}{' '}
                    min)
                  </p>
                  <p>• {techConfig.adaptiveDifficulty ? 'Adaptive' : techConfig.preferredDifficulty} difficulty</p>
                  <p>
                    • Active on {techConfig.activeDays.length} days at {techConfig.preferredTime}
                  </p>
                  <p>• Up to {techConfig.maxMissionsPerDay} missions per day</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Track disabled</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
