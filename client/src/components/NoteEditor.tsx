import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Image,
  Table,
  Code,
  Share,
  MoreHorizontal,
  Download,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import type { LocalNote } from '@shared/schema';

interface NoteEditorProps {
  note: LocalNote | null;
  onUpdateNote: (noteId: string, updates: Partial<LocalNote>) => void;
  autoSaveStatus: 'saved' | 'saving' | 'modified';
}

export function NoteEditor({ note, onUpdateNote, autoSaveStatus }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (note) {
      onUpdateNote(note.id, { title: newTitle });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (note) {
      onUpdateNote(note.id, { content: newContent });
    }
  };

  const handleAddTag = () => {
    if (!note || !newTag.trim()) return;
    
    const trimmedTag = newTag.trim();
    if (!note.tags.includes(trimmedTag)) {
      onUpdateNote(note.id, { 
        tags: [...note.tags, trimmedTag] 
      });
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!note) return;
    
    onUpdateNote(note.id, {
      tags: note.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const getTagColor = (tag: string) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink'];
    const index = tag.length % colors.length;
    return colors[index];
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-slate-500">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-medium mb-2">Select a note to start editing</h2>
          <p className="text-sm">Choose a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Editor Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className="text-2xl font-semibold border-none bg-transparent p-0 focus:ring-0 shadow-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Auto-save indicator */}
            <div className="flex items-center text-sm text-slate-500">
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  <span>Saved</span>
                </>
              )}
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              )}
              {autoSaveStatus === 'modified' && (
                <>
                  <div className="h-4 w-4 bg-amber-500 rounded-full mr-1" />
                  <span>Modified</span>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Note metadata */}
        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
          <span>Created {formatDate(note.createdAt)}</span>
          <span>•</span>
          <span>Last modified {formatDate(note.updatedAt)}</span>
          <span>•</span>
          <span>{getWordCount(content)} words</span>
        </div>
      </div>

      {/* Rich Text Editor Toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-1">
          {/* Formatting buttons */}
          <div className="flex items-center space-x-1 mr-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1 mx-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center space-x-1 mx-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <CheckSquare className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Insert elements */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Table className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-6">
        <Textarea
          ref={contentRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your note..."
          className="min-h-full border-none bg-transparent resize-none focus:ring-0 shadow-none text-base leading-relaxed"
        />
      </div>

      {/* Editor Footer with Tags */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-sm text-slate-500">Tags:</span>
            <div className="flex items-center space-x-2 flex-wrap">
              {note.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`text-sm px-2 py-1 bg-${getTagColor(tag)}-100 text-${getTagColor(tag)}-700 group cursor-pointer`}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
              
              {showTagInput ? (
                <div className="flex items-center space-x-1">
                  <Input
                    ref={tagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag();
                      } else if (e.key === 'Escape') {
                        setNewTag('');
                        setShowTagInput(false);
                      }
                    }}
                    onBlur={handleAddTag}
                    placeholder="Add tag..."
                    className="h-7 w-24 text-sm"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagInput(true)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span>{getCharacterCount(content)} characters</span>
            <Button variant="ghost" size="sm" className="text-sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
