import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  Upload,
  Plus,
  X,
  CheckCircle,
  FileText,
  FileJson,
  ArrowLeft
} from 'lucide-react';
import type { LocalNote } from '@shared/schema';

interface NoteEditorProps {
  note: LocalNote | null;
  onUpdateNote: (noteId: string, updates: Partial<LocalNote>) => void;
  autoSaveStatus: 'saved' | 'saving' | 'modified';
  onBack?: () => void;
}

export function NoteEditor({ note, onUpdateNote, autoSaveStatus, onBack }: NoteEditorProps) {
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

  const handleExportJSON = () => {
    if (!note) return;
    
    const exportData = {
      title: note.title,
      content: note.content,
      tags: note.tags,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    downloadFile(dataBlob, `${note.title || 'note'}.json`);
  };

  const handleExportText = () => {
    if (!note) return;
    
    const textContent = `${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}\nCreated: ${formatDate(note.createdAt)}\nModified: ${formatDate(note.updatedAt)}`;
    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    downloadFile(dataBlob, `${note.title || 'note'}.txt`);
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    
    const markdownContent = `# ${note.title}\n\n${note.content}\n\n---\n\n**Tags:** ${note.tags.map(tag => `\`${tag}\``).join(', ')}\n\n**Created:** ${formatDate(note.createdAt)}  \n**Modified:** ${formatDate(note.updatedAt)}`;
    const dataBlob = new Blob([markdownContent], { type: 'text/markdown' });
    downloadFile(dataBlob, `${note.title || 'note'}.md`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.md';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !note) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const importedData = JSON.parse(content);
            onUpdateNote(note.id, {
              title: importedData.title || note.title,
              content: importedData.content || content,
              tags: importedData.tags || note.tags
            });
          } else {
            // For .txt and .md files, import as content
            onUpdateNote(note.id, {
              content: content
            });
          }
        } catch (error) {
          console.error('Error importing file:', error);
          // Handle error silently for better UX
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
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
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
      {/* Editor Header */}
      <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 mr-4">
            {/* Mobile back button */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden mr-3 h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className="text-xl md:text-2xl font-semibold border-none bg-transparent p-0 focus:ring-0 shadow-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
            <Button variant="ghost" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportText}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Rich Text Editor Toolbar - Simplified on mobile */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          {/* Essential formatting on mobile */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
          </div>

          {/* Full toolbar on desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <Separator orientation="vertical" className="h-6 mr-3" />
            
            {/* Alignment */}
            <div className="flex items-center space-x-1 mr-3">
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

            {/* Extended options */}
            <div className="flex items-center space-x-1 ml-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <CheckSquare className="h-4 w-4" />
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
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-4 md:p-6">
        <Textarea
          ref={contentRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your note..."
          className="min-h-full border-none bg-transparent resize-none focus:ring-0 shadow-none text-base leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
        />
      </div>

      {/* Editor Footer with Tags */}
      <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-sm text-slate-500 dark:text-slate-400">Tags:</span>
            <div className="flex items-center space-x-2 flex-wrap">
              {note.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`text-sm px-2 py-1 bg-${getTagColor(tag)}-100 dark:bg-${getTagColor(tag)}-900/30 text-${getTagColor(tag)}-700 dark:text-${getTagColor(tag)}-300 group cursor-pointer`}
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
                    className="h-7 w-24 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagInput(true)}
                  className="h-7 w-7 p-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{getCharacterCount(content)} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
