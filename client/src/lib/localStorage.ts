import type { LocalNote, AppState } from "@shared/schema";

const NOTES_KEY = 'notemaster_notes';
const APP_STATE_KEY = 'notemaster_app_state';

// Access browser localStorage directly
const browserStorage = typeof window !== 'undefined' ? window.localStorage : null;

export class LocalStorageManager {
  // Notes management
  getNotes(): LocalNote[] {
    try {
      if (!browserStorage) return [];
      const notesJson = browserStorage.getItem(NOTES_KEY);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Error reading notes from localStorage:', error);
      return [];
    }
  }

  saveNotes(notes: LocalNote[]): void {
    try {
      if (!browserStorage) return;
      browserStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes to localStorage:', error);
    }
  }

  getNote(id: string): LocalNote | undefined {
    const notes = this.getNotes();
    return notes.find(note => note.id === id);
  }

  saveNote(note: LocalNote): void {
    const notes = this.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    
    this.saveNotes(notes);
  }

  deleteNote(id: string): void {
    const notes = this.getNotes();
    const noteIndex = notes.findIndex(n => n.id === id);
    
    if (noteIndex >= 0) {
      notes[noteIndex].isDeleted = true;
      notes[noteIndex].updatedAt = new Date().toISOString();
      this.saveNotes(notes);
    }
  }

  // App state management
  getAppState(): Partial<AppState> {
    try {
      const stateJson = window.localStorage.getItem(APP_STATE_KEY);
      return stateJson ? JSON.parse(stateJson) : {};
    } catch (error) {
      console.error('Error reading app state from localStorage:', error);
      return {};
    }
  }

  saveAppState(state: Partial<AppState>): void {
    try {
      const currentState = this.getAppState();
      const newState = { ...currentState, ...state };
      window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving app state to localStorage:', error);
    }
  }

  // Utility methods
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  createNote(title = 'Untitled Note', content = ''): LocalNote {
    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      title,
      content,
      tags: [],
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  searchNotes(query: string): LocalNote[] {
    const notes = this.getNotes().filter(note => !note.isDeleted);
    const searchTerm = query.toLowerCase();
    
    return notes.filter(note =>
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  getFilteredNotes(filter: 'all' | 'favorites' | 'archived' | 'trash'): LocalNote[] {
    const notes = this.getNotes();
    
    switch (filter) {
      case 'favorites':
        return notes.filter(note => !note.isDeleted && note.isFavorite);
      case 'archived':
        return notes.filter(note => !note.isDeleted && note.isArchived);
      case 'trash':
        return notes.filter(note => note.isDeleted);
      default:
        return notes.filter(note => !note.isDeleted && !note.isArchived);
    }
  }

  getNotesByTag(tag: string): LocalNote[] {
    return this.getNotes().filter(note => 
      !note.isDeleted && note.tags.includes(tag)
    );
  }

  getAllTags(): { tag: string; count: number; color: string }[] {
    const notes = this.getNotes().filter(note => !note.isDeleted);
    const tagCounts: Record<string, number> = {};
    
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink'];
    
    return Object.entries(tagCounts).map(([tag, count], index) => ({
      tag,
      count,
      color: colors[index % colors.length],
    }));
  }

  clearAll(): void {
    window.localStorage.removeItem(NOTES_KEY);
    window.localStorage.removeItem(APP_STATE_KEY);
  }
}

export const localStorage = new LocalStorageManager();
