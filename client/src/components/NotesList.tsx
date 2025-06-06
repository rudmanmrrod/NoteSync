import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, List, Paperclip } from 'lucide-react';
import type { LocalNote } from '@shared/schema';

interface NotesListProps {
  notes: LocalNote[];
  currentNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  sortBy: 'modified' | 'created' | 'title';
  onSortChange: (sort: 'modified' | 'created' | 'title') => void;
}

export function NotesList({
  notes,
  currentNoteId,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onToggleFavorite,
  sortBy,
  onSortChange
}: NotesListProps) {
  // Sort notes based on the selected criteria
  const sortedNotes = [...notes].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'modified':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours < 24) {
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return diffMinutes < 1 ? 'Just now' : `${diffMinutes} min ago`;
        }
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTagColor = (tag: string) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink'];
    const index = tag.length % colors.length;
    return colors[index];
  };

  const generatePreview = (content: string) => {
    // Strip HTML tags and get first 100 characters
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
        </div>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mt-3">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">Last Modified</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        {sortedNotes.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          <div className="space-y-0">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onNoteSelect(note.id)}
                className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 ${
                  currentNoteId === note.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-slate-900 line-clamp-1 flex-1 mr-2">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(note.id);
                    }}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <Star 
                      className={`h-3 w-3 ${
                        note.isFavorite 
                          ? 'fill-amber-500 text-amber-500' 
                          : 'text-slate-300 hover:text-amber-500'
                      }`} 
                    />
                  </Button>
                </div>
                
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                  {generatePreview(note.content) || 'No content'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(note.updatedAt)}</span>
                  <div className="flex items-center space-x-2">
                    {note.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className={`text-xs px-2 py-1 bg-${getTagColor(tag)}-100 text-${getTagColor(tag)}-700`}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-slate-400">+{note.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                    {note.content.includes('<img') && (
                      <Paperclip className="h-3 w-3" title="Has attachments" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
