import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { NotesList } from '@/components/NotesList';
import { NoteEditor } from '@/components/NoteEditor';
import { SettingsModal } from '@/components/SettingsModal';
import { localStorage } from '@/lib/localStorage';
import { syncManager } from '@/lib/syncManager';
import { useToast } from '@/hooks/use-toast';
import type { LocalNote, AppState } from '@shared/schema';

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // App state
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = localStorage.getAppState();
    return {
      notes: [],
      currentNoteId: null,
      searchQuery: '',
      selectedTag: null,
      sidebarCollapsed: false,
      syncStatus: 'offline',
      autoSaveStatus: 'saved',
      isSettingsOpen: false,
      ...savedState,
    };
  });

  // Current filter for notes list
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'archived' | 'trash'>('all');

  // Sort option for notes list
  const [sortBy, setSortBy] = useState<'modified' | 'created' | 'title'>('modified');

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Initialize notes from localStorage
  useEffect(() => {
    const notes = localStorage.getNotes();
    setAppState(prev => ({ ...prev, notes }));

    // Set up sync status callback
    syncManager.setStatusCallback((status) => {
      setAppState(prev => ({ ...prev, syncStatus: status }));
    });

    // Perform initial sync
    syncManager.performSync();
  }, []);

  // Save app state to localStorage when it changes
  useEffect(() => {
    localStorage.saveAppState(appState);
  }, [appState]);

  // Auto-save functionality
  const triggerAutoSave = useCallback((noteId: string, updates: Partial<LocalNote>) => {
    setAppState(prev => ({ ...prev, autoSaveStatus: 'modified' }));

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      setAppState(prev => ({ ...prev, autoSaveStatus: 'saving' }));
      
      // Update the note in localStorage
      const notes = localStorage.getNotes();
      const noteIndex = notes.findIndex(n => n.id === noteId);
      if (noteIndex >= 0) {
        notes[noteIndex] = { ...notes[noteIndex], ...updates, updatedAt: new Date().toISOString() };
        localStorage.saveNotes(notes);
        setAppState(prev => ({ 
          ...prev, 
          notes,
          autoSaveStatus: 'saved' 
        }));
      }
    }, 1000);

    setAutoSaveTimer(timer);
  }, [autoSaveTimer]);

  // Get filtered and searched notes
  const getFilteredNotes = () => {
    let notes = localStorage.getFilteredNotes(activeFilter);

    if (appState.selectedTag) {
      notes = notes.filter(note => note.tags.includes(appState.selectedTag!));
    }

    if (appState.searchQuery) {
      const searchTerm = appState.searchQuery.toLowerCase();
      notes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return notes;
  };

  // Get current note
  const getCurrentNote = () => {
    if (!appState.currentNoteId) return null;
    return appState.notes.find(note => note.id === appState.currentNoteId) || null;
  };

  // Get all tags with counts
  const getAllTags = () => {
    return localStorage.getAllTags();
  };

  // Handlers
  const handleCreateNote = () => {
    const newNote = localStorage.createNote();
    localStorage.saveNote(newNote);
    
    const updatedNotes = localStorage.getNotes();
    setAppState(prev => ({
      ...prev,
      notes: updatedNotes,
      currentNoteId: newNote.id
    }));

    toast({
      title: "Note created",
      description: "A new note has been created.",
    });
  };

  const handleNoteSelect = (noteId: string) => {
    setAppState(prev => ({ ...prev, currentNoteId: noteId }));
  };

  const handleUpdateNote = (noteId: string, updates: Partial<LocalNote>) => {
    // Update local state immediately for responsive UI
    setAppState(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    }));

    // Trigger auto-save
    triggerAutoSave(noteId, updates);
  };

  const handleToggleFavorite = (noteId: string) => {
    const note = appState.notes.find(n => n.id === noteId);
    if (note) {
      handleUpdateNote(noteId, { isFavorite: !note.isFavorite });
      toast({
        title: note.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${note.title}" has been ${note.isFavorite ? 'removed from' : 'added to'} favorites.`,
      });
    }
  };

  const handleFilterChange = (filter: 'all' | 'favorites' | 'archived' | 'trash') => {
    setActiveFilter(filter);
    setAppState(prev => ({ ...prev, selectedTag: null, searchQuery: '' }));
  };

  const handleTagSelect = (tag: string | null) => {
    setAppState(prev => ({ ...prev, selectedTag: tag }));
    if (tag) {
      setActiveFilter('all');
    }
  };

  const handleSearchChange = (query: string) => {
    setAppState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleManualSync = async () => {
    const success = await syncManager.manualSync();
    if (success) {
      const updatedNotes = localStorage.getNotes();
      setAppState(prev => ({ ...prev, notes: updatedNotes }));
      toast({
        title: "Sync completed",
        description: "Your notes have been synced successfully.",
      });
    } else {
      toast({
        title: "Sync failed",
        description: "Unable to sync notes. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSidebar = () => {
    setAppState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const handleOpenSettings = () => {
    setAppState(prev => ({ ...prev, isSettingsOpen: true }));
  };

  const handleCloseSettings = () => {
    setAppState(prev => ({ ...prev, isSettingsOpen: false }));
  };

  const filteredNotes = getFilteredNotes();
  const currentNote = getCurrentNote();
  const allTags = getAllTags();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        notes={appState.notes}
        appState={appState}
        onCreateNote={handleCreateNote}
        onFilterChange={handleFilterChange}
        onTagSelect={handleTagSelect}
        onManualSync={handleManualSync}
        onOpenSettings={handleOpenSettings}
        onToggleSidebar={handleToggleSidebar}
        activeFilter={activeFilter}
        tags={allTags}
      />

      <NotesList
        notes={filteredNotes}
        currentNoteId={appState.currentNoteId}
        searchQuery={appState.searchQuery}
        onSearchChange={handleSearchChange}
        onNoteSelect={handleNoteSelect}
        onToggleFavorite={handleToggleFavorite}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <NoteEditor
        note={currentNote}
        onUpdateNote={handleUpdateNote}
        autoSaveStatus={appState.autoSaveStatus}
      />

      <SettingsModal
        isOpen={appState.isSettingsOpen}
        onClose={handleCloseSettings}
        syncStatus={appState.syncStatus}
      />
    </div>
  );
}
