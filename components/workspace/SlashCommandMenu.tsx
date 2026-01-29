'use client';

import { Heading1, Heading2, CheckSquare, List } from 'lucide-react';

import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface SlashCommandMenuProps {
  onSelect: (command: string) => void;
  position: { top: number; left: number };
}

export function SlashCommandMenu({ onSelect, position }: SlashCommandMenuProps) {
  return (
    <div
      className="absolute z-50 w-60 rounded-lg border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.top, left: position.left }}
    >
      <Command>
        <CommandList>
          <CommandGroup heading="Basic Blocks">
            <CommandItem onSelect={() => onSelect('# ')}>
              <Heading1 className="mr-2 h-4 w-4" />
              <span>Heading 1</span>
            </CommandItem>
            <CommandItem onSelect={() => onSelect('## ')}>
              <Heading2 className="mr-2 h-4 w-4" />
              <span>Heading 2</span>
            </CommandItem>
            <CommandItem onSelect={() => onSelect('- [ ] ')}>
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>To-do List</span>
            </CommandItem>
            <CommandItem onSelect={() => onSelect('- ')}>
              <List className="mr-2 h-4 w-4" />
              <span>Bullet List</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
