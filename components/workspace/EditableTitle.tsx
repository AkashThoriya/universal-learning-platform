'use client';

import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditableTitle({ value, onChange, placeholder, className }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setIsEditing(false);
          }
        }}
        placeholder={placeholder}
        className={cn(className, 'bg-transparent border-none focus:outline-none w-full p-0 m-0')}
      />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            onClick={() => setIsEditing(true)}
            className={cn(className, 'cursor-text truncate select-none')}
            title="" // Disable native tooltip
          >
            {value || <span className="text-muted-foreground/30">{placeholder}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <p className="max-w-[400px] break-words text-sm font-normal py-1">{value || placeholder}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
