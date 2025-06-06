import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Untitled Note"),
  content: text("content").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  firebaseId: text("firebase_id"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});

export const updateNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Client-side types for local storage
export interface LocalNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  firebaseId?: string;
  lastSyncedAt?: string;
}

export interface AppState {
  notes: LocalNote[];
  currentNoteId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  sidebarCollapsed: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  autoSaveStatus: 'saved' | 'saving' | 'modified';
  isSettingsOpen: boolean;
}
