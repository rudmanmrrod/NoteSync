import { notes, type Note, type InsertNote, type UpdateNote } from "@shared/schema";

export interface IStorage {
  getNotes(): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: UpdateNote): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  searchNotes(query: string): Promise<Note[]>;
  getNotesByTag(tag: string): Promise<Note[]>;
  getFavoriteNotes(): Promise<Note[]>;
  getArchivedNotes(): Promise<Note[]>;
  getDeletedNotes(): Promise<Note[]>;
}

export class MemStorage implements IStorage {
  private notes: Map<number, Note>;
  private currentId: number;

  constructor() {
    this.notes = new Map();
    this.currentId = 1;
  }

  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => !note.isDeleted);
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentId++;
    const now = new Date();
    const note: Note = {
      ...insertNote,
      id,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: null,
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, updateNote: UpdateNote): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;

    const updatedNote: Note = {
      ...existingNote,
      ...updateNote,
      updatedAt: new Date(),
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return false;

    const deletedNote: Note = {
      ...existingNote,
      isDeleted: true,
      updatedAt: new Date(),
    };
    this.notes.set(id, deletedNote);
    return true;
  }

  async searchNotes(query: string): Promise<Note[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.notes.values()).filter(note => 
      !note.isDeleted && (
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  }

  async getNotesByTag(tag: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => 
      !note.isDeleted && note.tags.includes(tag)
    );
  }

  async getFavoriteNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => 
      !note.isDeleted && note.isFavorite
    );
  }

  async getArchivedNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => 
      !note.isDeleted && note.isArchived
    );
  }

  async getDeletedNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.isDeleted);
  }
}

export const storage = new MemStorage();
