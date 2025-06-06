import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, updateNoteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all notes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Get single note
  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  // Create note
  app.post("/api/notes", async (req, res) => {
    try {
      const validatedNote = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedNote);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ message: "Invalid note data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Update note
  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedUpdate = updateNoteSchema.parse(req.body);
      const note = await storage.updateNote(id, validatedUpdate);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ message: "Invalid note data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // Delete note (soft delete)
  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNote(id);
      
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Search notes
  app.get("/api/notes/search/:query", async (req, res) => {
    try {
      const query = decodeURIComponent(req.params.query);
      const notes = await storage.searchNotes(query);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search notes" });
    }
  });

  // Get notes by tag
  app.get("/api/tags/:tag/notes", async (req, res) => {
    try {
      const tag = decodeURIComponent(req.params.tag);
      const notes = await storage.getNotesByTag(tag);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes by tag" });
    }
  });

  // Get favorite notes
  app.get("/api/notes/favorites", async (req, res) => {
    try {
      const notes = await storage.getFavoriteNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite notes" });
    }
  });

  // Get archived notes
  app.get("/api/notes/archived", async (req, res) => {
    try {
      const notes = await storage.getArchivedNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archived notes" });
    }
  });

  // Get deleted notes
  app.get("/api/notes/trash", async (req, res) => {
    try {
      const notes = await storage.getDeletedNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deleted notes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
