'use client';

import { FileText, Eye, Heading, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  previewClassName?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-[300px]',
  className,
  previewClassName,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertSyntax = (syntax: string) => {
    // Simple append for now - complex cursor insertion requires ref handling which can be added later if needed
    onChange(value + syntax);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-48 grid-cols-2">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'write' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertSyntax('**bold** ')}
                className="h-8 w-8 p-0"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertSyntax('*italic* ')}
                className="h-8 w-8 p-0"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertSyntax('# ')}
                className="h-8 w-8 p-0"
                title="Heading"
              >
                <Heading className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertSyntax('- ')}
                className="h-8 w-8 p-0"
                title="List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertSyntax('1. ')}
                className="h-8 w-8 p-0"
                title="Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? 'Write in markdown...'}
            className={cn('font-mono text-sm resize-y', minHeight)}
          />
          <div className="text-xs text-muted-foreground mt-2 flex justify-between">
             <span>Supports Markdown: **bold**, *italic*, - list, etc.</span>
             <span>{value.length} characters</span>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card className={cn("overflow-hidden border bg-background", minHeight)}>
            <CardContent className="p-4 md:p-6 overflow-auto max-h-[600px]">
              {value ? (
                <div className={cn("prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words", previewClassName)}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[200px]">
                  <Eye className="h-8 w-8 mb-2 opacity-20" />
                  <p>Nothing to preview yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
