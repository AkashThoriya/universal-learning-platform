'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  CheckCircle,
  Target,
  BookOpen,
  AlertCircle,
  FileText,
  Lightbulb,
  Save,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { EmptyState } from '@/components/ui/empty-state';
import { Subtopic } from '@/types/exam';
import { cn } from '@/lib/utils/utils';

interface SubtopicSheetContentProps {
  subtopic: Subtopic;
  onUpdate: (updates: Partial<Subtopic>) => void;
}

export function SubtopicSheetContent({ subtopic, onUpdate }: SubtopicSheetContentProps) {
  // Local state for editable content
  const [localNotes, setLocalNotes] = useState(subtopic.userNotes || '');
  const [localContext, setLocalContext] = useState(subtopic.personalContext || '');
  const [localCurrentAffairs, setLocalCurrentAffairs] = useState<Array<{ date: Timestamp; note: string }>>(
    subtopic.currentAffairs || []
  );
  const [newAffair, setNewAffair] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset local state when subtopic changes
  useEffect(() => {
    setLocalNotes(subtopic.userNotes || '');
    setLocalContext(subtopic.personalContext || '');
    setLocalCurrentAffairs(subtopic.currentAffairs || []);
    setNewAffair('');
    setHasChanges(false);
  }, [subtopic.id, subtopic.userNotes, subtopic.personalContext, subtopic.currentAffairs]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    setHasChanges(true);
  };

  const handleContextChange = (value: string) => {
    setLocalContext(value);
    setHasChanges(true);
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      onUpdate({
        userNotes: localNotes,
        personalContext: localContext,
        currentAffairs: localCurrentAffairs,
      });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  // Current Affairs handlers
  const handleAddCurrentAffair = () => {
    if (!newAffair.trim()) return;
    const newAffairs = [...localCurrentAffairs, { date: Timestamp.now(), note: newAffair.trim() }];
    setLocalCurrentAffairs(newAffairs);
    onUpdate({ currentAffairs: newAffairs });
    setNewAffair('');
  };

  const handleDeleteCurrentAffair = (index: number) => {
    const newAffairs = localCurrentAffairs.filter((_, i) => i !== index);
    setLocalCurrentAffairs(newAffairs);
    onUpdate({ currentAffairs: newAffairs });
  };

  // Action handlers
  const handleComplete = () => {
    const isCompleting = subtopic.status !== 'completed';
    onUpdate({
      status: isCompleting ? 'completed' : 'in_progress',
      ...(isCompleting && { completedAt: Timestamp.now() }),
    });
  };

  const handlePractice = () => {
    onUpdate({
      practiceCount: subtopic.practiceCount + 1,
      lastPracticed: Timestamp.now(),
      status: subtopic.status === 'not_started' ? 'in_progress' : subtopic.status,
    });
  };

  const handleRevise = () => {
    onUpdate({
      revisionCount: subtopic.revisionCount + 1,
      lastRevised: Timestamp.now(),
      status: subtopic.status === 'not_started' ? 'in_progress' : subtopic.status,
    });
  };

  const handleReview = () => {
    const flagging = !subtopic.needsReview;
    onUpdate({
      needsReview: flagging,
      ...(flagging && { reviewRequestedAt: Timestamp.now() }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full shrink-0',
              subtopic.status === 'completed' && 'bg-green-500',
              subtopic.status === 'in_progress' && 'bg-yellow-500',
              subtopic.status === 'not_started' && 'bg-gray-300',
              subtopic.status === 'mastered' && 'bg-blue-500'
            )}
          />
          {subtopic.name}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="capitalize">
            {subtopic.status.replace('_', ' ')}
          </Badge>
          {subtopic.needsReview && <Badge variant="destructive">⚠️ Needs Review</Badge>}
        </div>
      </div>

      {/* Tabs for full feature parity - now 4 tabs */}
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="actions" className="text-xs sm:text-sm">
            <Target className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Track</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            <FileText className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="context" className="text-xs sm:text-sm">
            <Lightbulb className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Context</span>
          </TabsTrigger>
          <TabsTrigger value="current-affairs" className="text-xs sm:text-sm">
            <Calendar className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Affairs</span>
          </TabsTrigger>
        </TabsList>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Track Progress</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleComplete}
                variant={subtopic.status === 'completed' ? 'default' : 'outline'}
                size="sm"
                className={cn('min-h-[44px]', subtopic.status === 'completed' && 'bg-green-600 hover:bg-green-700')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {subtopic.status === 'completed' ? 'Completed ✓' : 'Complete'}
              </Button>
              <Button onClick={handlePractice} variant="outline" size="sm" className="min-h-[44px]">
                <Target className="h-4 w-4 mr-2" />
                Practice {subtopic.practiceCount > 0 && `(${subtopic.practiceCount})`}
              </Button>
              <Button onClick={handleRevise} variant="outline" size="sm" className="min-h-[44px]">
                <BookOpen className="h-4 w-4 mr-2" />
                Revised {subtopic.revisionCount > 0 && `(${subtopic.revisionCount})`}
              </Button>
              <Button
                onClick={handleReview}
                variant={subtopic.needsReview ? 'destructive' : 'outline'}
                size="sm"
                className="min-h-[44px]"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {subtopic.needsReview ? 'Flagged ⚠️' : 'Needs Review'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Practice Count</p>
              <p className="text-lg font-semibold">{subtopic.practiceCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Revision Count</p>
              <p className="text-lg font-semibold">{subtopic.revisionCount}</p>
            </div>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Study Notes</p>
            <p className="text-xs text-muted-foreground">
              Add key concepts, formulas, and important points for this subtopic
            </p>
          </div>
          <MarkdownEditor
            value={localNotes}
            onChange={handleNotesChange}
            placeholder="Add your study notes for this subtopic..."
            minHeight="min-h-[200px]"
          />
          {hasChanges && (
            <Button onClick={handleSaveContent} disabled={saving} className="w-full min-h-[44px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          )}
        </TabsContent>

        {/* Context Tab */}
        <TabsContent value="context" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Personal Context</p>
            <p className="text-xs text-muted-foreground">
              Why is this subtopic important? How does it connect to other concepts?
            </p>
          </div>
          <MarkdownEditor
            value={localContext}
            onChange={handleContextChange}
            placeholder="Create your personal context for this subtopic..."
            minHeight="min-h-[200px]"
          />
          {hasChanges && (
            <Button onClick={handleSaveContent} disabled={saving} className="w-full min-h-[44px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Context'}
            </Button>
          )}
        </TabsContent>

        {/* Current Affairs Tab - NEW */}
        <TabsContent value="current-affairs" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Affairs</p>
            <p className="text-xs text-muted-foreground">Track recent news and developments related to this subtopic</p>
          </div>

          {/* Add new affair */}
          <div className="flex gap-2">
            <Input
              value={newAffair}
              onChange={e => setNewAffair(e.target.value)}
              placeholder="Add a current affairs note..."
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddCurrentAffair()}
            />
            <Button onClick={handleAddCurrentAffair} disabled={!newAffair.trim()} className="shrink-0 min-h-[44px]">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          {/* List of affairs */}
          {localCurrentAffairs.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No current affairs yet"
              description="Add notes about recent news and developments related to this subtopic"
            />
          ) : (
            <div className="space-y-2">
              {localCurrentAffairs.map((affair, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex justify-between items-start gap-2 bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm break-words">{affair.note}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(affair.date.toDate(), 'MMM d, yyyy')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCurrentAffair(idx)}
                    className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
